import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from '../../rooms/entities/room.entity.js';
import { User } from '../../users/entities/user.entity.js';

export enum BookingStatus {
  CONFIRMED = 'Đã đặt',
  ACTIVE = 'Đang sử dụng',
  COMPLETED = 'Hoàn thành',
  EARLY_END = 'Kết thúc sớm',
  CANCELLED = 'Đã hủy',
  NO_SHOW = 'Tự hủy - No-show',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.CONFIRMED })
  status: BookingStatus;

  @Column({ name: 'is_reminder_sent', default: false })
  isReminderSent: boolean;

  @Column({ name: 'is_end_reminder_sent', default: false })
  isEndReminderSent: boolean;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'room_id' })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
