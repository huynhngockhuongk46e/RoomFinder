import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailService } from '../common/mail/mail.service.js';
import { Booking, BookingStatus } from './entities/booking.entity.js';
import { BookingsService } from './bookings.service.js';

@Injectable()
export class BookingsCron {
  private readonly logger = new Logger(BookingsCron.name);

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly mailService: MailService,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const now = new Date();
    const todayStr = this.toLocalDateString(now);
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;

    const upcomingBookings = await this.bookingRepo.find({
      where: {
        date: todayStr,
        startTime: currentTime,
        status: BookingStatus.CONFIRMED,
        isReminderSent: false,
      },
      relations: { room: true, user: true },
    });

    for (const booking of upcomingBookings) {
      await this.mailService.sendCheckInEmail(
        booking.user.email,
        booking.room.name,
        booking.startTime,
        booking.id,
      );
      booking.isReminderSent = true;
      await this.bookingRepo.save(booking);
    }

    await this.bookingsService.handleAutoCompleteBookings();
    await this.sendEndReminders(now, todayStr);
    await this.bookingsService.handleNoShowBookings();
    this.logger.debug(`Đã quét booking lúc ${todayStr} ${currentTime}`);
  }

  private async sendEndReminders(now: Date, todayStr: string) {
    const activeBookings = await this.bookingRepo.find({
      where: {
        date: todayStr,
        status: BookingStatus.ACTIVE,
        isEndReminderSent: false,
      },
      relations: { room: true, user: true },
    });

    for (const booking of activeBookings) {
      const [hours, minutes] = booking.endTime.split(':').map(Number);
      const endDateTime = new Date(now);
      endDateTime.setHours(hours, minutes, 0, 0);
      const minutesRemaining =
        (endDateTime.getTime() - now.getTime()) / (1000 * 60);

      if (minutesRemaining <= 10 && minutesRemaining > 0) {
        await this.mailService.sendReminderEmail(
          booking.user.email,
          booking.room.name,
          booking.endTime,
        );
        booking.isEndReminderSent = true;
        await this.bookingRepo.save(booking);
        this.logger.log(
          `Đã gửi email nhắc sắp hết giờ cho phòng ${booking.room.name}`,
        );
      }
    }
  }

  private toLocalDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
