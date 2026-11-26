import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from '../common/mail/mail.service.js';
import { Room } from '../rooms/entities/room.entity.js';
import { Schedule } from '../schedules/entities/schedule.entity.js';
import { Booking } from './entities/booking.entity.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { BookingsCron } from './bookings.cron.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Booking, Room, Schedule]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsCron, MailService],
})
export class BookingsModule {}
