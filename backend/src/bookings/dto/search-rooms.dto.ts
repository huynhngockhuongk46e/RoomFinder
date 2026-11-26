import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';
import { RoomType } from '../../rooms/entities/room.entity.js';

export class SearchRoomsDto {
  @IsNotEmpty()
  @IsDateString({}, { message: 'Ngày không hợp lệ (YYYY-MM-DD)' })
  date: string;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;

  @IsEnum(RoomType)
  type: RoomType;
}
