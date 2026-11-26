import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { Schedule } from './entities/schedule.entity.js';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly repo: Repository<Schedule>,
  ) {}

  async create(dto: CreateScheduleDto) {
    this.validateTimeRange(dto.startTime, dto.endTime);
    if (await this.checkConflict(dto.roomId, dto.dayOfWeek, dto.startTime, dto.endTime)) {
      throw new BadRequestException(
        'Trùng lịch! Phòng này đã có lớp học vào khung giờ này.',
      );
    }
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({
      relations: { room: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateScheduleDto) {
    const schedule = await this.repo.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch học');
    }

    const roomId = dto.roomId ?? schedule.roomId;
    const dayOfWeek = dto.dayOfWeek ?? schedule.dayOfWeek;
    const startTime = dto.startTime ?? schedule.startTime;
    const endTime = dto.endTime ?? schedule.endTime;
    this.validateTimeRange(startTime, endTime);

    if (
      await this.checkConflict(
        roomId,
        dayOfWeek,
        startTime,
        endTime,
        id,
      )
    ) {
      throw new BadRequestException(
        'Trùng lịch! Phòng này đã có lớp học vào khung giờ này.',
      );
    }

    Object.assign(schedule, dto);
    return this.repo.save(schedule);
  }

  async remove(id: string) {
    const schedule = await this.repo.findOne({ where: { id } });
    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch học');
    }
    await this.repo.remove(schedule);
    return { message: 'Xóa lịch học thành công' };
  }

  private async checkConflict(
    roomId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ) {
    const query = this.repo
      .createQueryBuilder('schedule')
      .where('schedule.room_id = :roomId', { roomId })
      .andWhere('schedule.day_of_week = :dayOfWeek', { dayOfWeek })
      .andWhere('schedule.start_time < :endTime', { endTime })
      .andWhere('schedule.end_time > :startTime', { startTime });

    if (excludeId) {
      query.andWhere('schedule.id != :excludeId', { excludeId });
    }

    return (await query.getCount()) > 0;
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Giờ kết thúc phải sau giờ bắt đầu',
      );
    }
  }
}
