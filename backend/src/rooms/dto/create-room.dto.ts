import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RoomStatus, RoomType } from '../entities/room.entity.js';

export class CreateRoomDto {
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  building?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  capacity: number;

  @IsEnum(RoomType)
  type: RoomType;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @IsString()
  description?: string;
}
