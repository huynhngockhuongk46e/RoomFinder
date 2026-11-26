import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RoomType {
  THEORY = 'Lý thuyết',
  PRACTICE = 'Thực hành',
}

export enum RoomStatus {
  ACTIVE = 'Hoạt động',
  MAINTENANCE = 'Bảo trì',
  LOCKED = 'Đã khóa',
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  building: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ type: 'enum', enum: RoomType, default: RoomType.THEORY })
  type: RoomType;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.ACTIVE })
  status: RoomStatus;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
