import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Room, RoomStatus } from '../rooms/entities/room.entity.js';
import { Schedule } from '../schedules/entities/schedule.entity.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { SearchRoomsDto } from './dto/search-rooms.dto.js';
import { Booking, BookingStatus } from './entities/booking.entity.js';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
  ) {}

  async searchEmptyRooms(dto: SearchRoomsDto) {
    this.validateTimeRange(dto.startTime, dto.endTime);
    const dayOfWeek = this.getDayOfWeek(dto.date);
    const rooms = await this.roomRepo
      .createQueryBuilder('room')
      .where('room.status = :status', { status: RoomStatus.ACTIVE })
      .andWhere('room.type = :type', { type: dto.type })
      .andWhere('room.capacity >= :capacity', { capacity: dto.capacity })
      .orderBy('room.capacity', 'ASC')
      .getMany();

    const availableRooms: Room[] = [];
    for (const room of rooms) {
      const scheduleConflict = await this.scheduleRepo
        .createQueryBuilder('schedule')
        .where('schedule.room_id = :roomId', { roomId: room.id })
        .andWhere('schedule.day_of_week = :dayOfWeek', { dayOfWeek })
        .andWhere('schedule.start_time < :endTime', {
          endTime: dto.endTime,
        })
        .andWhere('schedule.end_time > :startTime', {
          startTime: dto.startTime,
        })
        .getOne();

      if (scheduleConflict) continue;

      const bookingConflict = await this.bookingRepo
        .createQueryBuilder('booking')
        .where('booking.room_id = :roomId', { roomId: room.id })
        .andWhere('booking.date = :date', { date: dto.date })
        .andWhere('booking.status IN (:...statuses)', {
          statuses: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
        })
        .andWhere('booking.start_time < :endTime', { endTime: dto.endTime })
        .andWhere('booking.end_time > :startTime', {
          startTime: dto.startTime,
        })
        .getOne();

      if (!bookingConflict) availableRooms.push(room);
    }

    return availableRooms;
  }

  async createBooking(userId: string, dto: CreateBookingDto) {
    this.validateTimeRange(dto.startTime, dto.endTime);
    const diffDays = this.getDateDifferenceFromToday(dto.date);
    if (diffDays < 0) {
      throw new BadRequestException('Không thể đặt phòng trong quá khứ');
    }
    if (diffDays > 7) {
      throw new BadRequestException('Chỉ được đặt phòng trước tối đa 7 ngày');
    }

    const durationHours =
      this.getTimeInMinutes(dto.endTime) / 60 -
      this.getTimeInMinutes(dto.startTime) / 60;
    if (durationHours > 4) {
      throw new BadRequestException(
        'Một lượt đặt không được vượt quá 4 tiếng',
      );
    }

    const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
    if (!room || room.status !== RoomStatus.ACTIVE) {
      throw new BadRequestException('Phòng không tồn tại hoặc không hoạt động');
    }

    const userBookingsToday = await this.bookingRepo.count({
      where: {
        userId,
        date: dto.date,
        status: In([BookingStatus.CONFIRMED, BookingStatus.ACTIVE]),
      },
    });
    if (userBookingsToday >= 3) {
      throw new BadRequestException(
        'Bạn đã đạt giới hạn 3 lượt đặt trong ngày hôm nay',
      );
    }

    const dayOfWeek = this.getDayOfWeek(dto.date);
    const scheduleConflict = await this.scheduleRepo
      .createQueryBuilder('schedule')
      .where('schedule.room_id = :roomId', { roomId: dto.roomId })
      .andWhere('schedule.day_of_week = :dayOfWeek', { dayOfWeek })
      .andWhere('schedule.start_time < :endTime', { endTime: dto.endTime })
      .andWhere('schedule.end_time > :startTime', {
        startTime: dto.startTime,
      })
      .getOne();
    if (scheduleConflict) {
      throw new BadRequestException(
        'Phòng đã có lịch học trong khoảng thời gian bạn yêu cầu',
      );
    }

    const bookingConflict = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.room_id = :roomId', { roomId: dto.roomId })
      .andWhere('booking.date = :date', { date: dto.date })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
      })
      .andWhere('booking.start_time < :endTime', { endTime: dto.endTime })
      .andWhere('booking.end_time > :startTime', {
        startTime: dto.startTime,
      })
      .getOne();
    if (bookingConflict) {
      throw new BadRequestException(
        'Phòng đã được đăng ký trong khoảng thời gian bạn yêu cầu',
      );
    }

    const booking = this.bookingRepo.create({
      roomId: dto.roomId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      userId,
    });
    return this.bookingRepo.save(booking);
  }

  getMyBookings(userId: string) {
    return this.bookingRepo.find({
      where: { userId },
      relations: { room: true },
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, userId },
    });
    if (!booking) {
      throw new NotFoundException('Không tìm thấy lượt đặt');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Lượt đặt này đã bị hủy rồi');
    }

    const startDateTime = new Date(
      `${booking.date}T${booking.startTime}:00`,
    );
    const diffMinutes =
      (startDateTime.getTime() - Date.now()) / (1000 * 60);
    if (diffMinutes < 30) {
      throw new BadRequestException(
        'Chỉ được hủy phòng trước giờ sử dụng ít nhất 30 phút.',
      );
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingRepo.save(booking);
  }

  async checkIn(userId: string, bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, userId },
      relations: { room: true },
    });
    if (!booking) {
      throw new NotFoundException('Không tìm thấy lượt đặt');
    }
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Lượt đặt không ở trạng thái chờ xác nhận',
      );
    }

    booking.status = BookingStatus.ACTIVE;
    return this.bookingRepo.save(booking);
  }

  async endEarly(userId: string, bookingId: string) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, userId },
    });
    if (!booking) {
      throw new NotFoundException('Không tìm thấy lượt đặt');
    }
    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BadRequestException(
        'Chỉ có thể kết thúc sớm khi đang sử dụng phòng',
      );
    }

    booking.status = BookingStatus.EARLY_END;
    await this.bookingRepo.save(booking);
    return {
      message: 'Đã kết thúc sớm. Thời gian còn lại đã được giải phóng.',
    };
  }

  async extendBooking(
    userId: string,
    bookingId: string,
    newEndTime: string,
  ) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, userId },
      relations: { room: true },
    });
    if (!booking) {
      throw new NotFoundException('Không tìm thấy lượt đặt');
    }
    if (booking.status !== BookingStatus.ACTIVE) {
      throw new BadRequestException(
        'Chỉ có thể gia hạn khi đang sử dụng phòng',
      );
    }
    if (!this.isValidTime(newEndTime)) {
      throw new BadRequestException('Giờ kết thúc mới không hợp lệ');
    }

    const start = this.toLocalDateTime(booking.date, booking.startTime);
    const oldEnd = this.toLocalDateTime(booking.date, booking.endTime);
    const newEnd = this.toLocalDateTime(booking.date, newEndTime);
    if (newEnd <= oldEnd) {
      throw new BadRequestException(
        'Giờ kết thúc mới phải muộn hơn giờ kết thúc cũ',
      );
    }

    const totalTime = oldEnd.getTime() - start.getTime();
    const elapsedTime = Date.now() - start.getTime();
    if (elapsedTime < totalTime * (2 / 3)) {
      throw new BadRequestException(
        'Bạn chỉ được gia hạn khi đã sử dụng quá 2/3 thời gian đăng ký.',
      );
    }

    const newTotalHours =
      (newEnd.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (newTotalHours > 4) {
      throw new BadRequestException(
        'Tổng thời gian sử dụng (kể cả gia hạn) không được vượt quá 4 tiếng.',
      );
    }

    const conflict = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.room_id = :roomId', { roomId: booking.roomId })
      .andWhere('booking.date = :date', { date: booking.date })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
      })
      .andWhere('booking.start_time < :newEndTime', {
        newEndTime,
      })
      .andWhere('booking.end_time > :oldEndTime', {
        oldEndTime: booking.endTime,
      })
      .getOne();

    if (conflict) {
      throw new BadRequestException(
        'Phòng đã có người đặt trong khoảng thời gian gia hạn. Vui lòng chọn phòng khác.',
      );
    }

    booking.endTime = newEndTime;
    await this.bookingRepo.save(booking);
    return { message: 'Gia hạn phòng thành công!', booking };
  }

  async handleAutoCompleteBookings() {
    const now = new Date();
    const todayStr = this.toLocalDateString(now);
    const activeBookings = await this.bookingRepo.find({
      where: { date: todayStr, status: BookingStatus.ACTIVE },
      relations: { room: true, user: true },
    });

    for (const booking of activeBookings) {
      const endDateTime = this.toLocalDateTime(
        booking.date,
        booking.endTime,
      );
      const diffMinutes =
        (now.getTime() - endDateTime.getTime()) / (1000 * 60);

      if (diffMinutes >= 1) {
        booking.status = BookingStatus.COMPLETED;
        await this.bookingRepo.save(booking);
        this.logger.log(
          `Đã tự động hoàn thành booking ${booking.id} của phòng ${booking.room.name} cho user ${booking.user.email} do hết giờ`,
        );
      }
    }
  }

  async handleNoShowBookings() {
    const now = new Date();
    const todayStr = this.toLocalDateString(now);
    const pendingBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('booking.user', 'user')
      .where('booking.date = :date', { date: todayStr })
      .andWhere('booking.status = :status', {
        status: BookingStatus.CONFIRMED,
      })
      .getMany();

    this.logger.debug(
      `Quét ${pendingBookings.length} booking chờ check-in ngày ${todayStr}`,
    );

    for (const booking of pendingBookings) {
      const [year, month, day] = booking.date.split('-').map(Number);
      const [hour, minute] = booking.startTime.split(':').map(Number);
      const startDateTime = new Date(year, month - 1, day, hour, minute);
      const diffMinutes =
        (now.getTime() - startDateTime.getTime()) / (1000 * 60);
      if (diffMinutes >= 1) {
        booking.status = BookingStatus.NO_SHOW;
        await this.bookingRepo.save(booking);
        this.logger.log(
          `Đã tự động hủy booking ${booking.id} sau ${Math.floor(
            diffMinutes,
          )} phút không check-in`,
        );
      }
    }
  }

  // Chuyển đổi ngày YYYY-MM-DD sang thứ theo giờ địa phương.
  private getDayOfWeek(dateString: string): number {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 ? 8 : dayOfWeek + 1;
  }

  private getDateDifferenceFromToday(dateString: string) {
    const today = new Date();
    const todayUtc = Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const bookingDate = new Date(`${dateString}T00:00:00`);
    const bookingUtc = Date.UTC(
      bookingDate.getFullYear(),
      bookingDate.getMonth(),
      bookingDate.getDate(),
    );
    return Math.round((bookingUtc - todayUtc) / 86400000);
  }

  private toLocalDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (
      !this.isValidTime(startTime) ||
      !this.isValidTime(endTime) ||
      startTime >= endTime
    ) {
      throw new BadRequestException('Khung giờ không hợp lệ');
    }
  }

  private isValidTime(time: string) {
    if (!/^\d{2}:\d{2}$/.test(time)) return false;
    const [hours, minutes] = time.split(':').map(Number);
    return hours < 24 && minutes < 60;
  }

  private getTimeInMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private toLocalDateTime(date: string, time: string) {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  }
}
