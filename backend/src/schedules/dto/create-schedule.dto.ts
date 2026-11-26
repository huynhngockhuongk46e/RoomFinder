import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateScheduleDto {
  @IsNotEmpty({ message: 'Tên môn học không được để trống' })
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  lecturerName?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(2)
  @Max(8)
  dayOfWeek: number;

  @IsNotEmpty()
  @IsString()
  startTime: string;

  @IsNotEmpty()
  @IsString()
  endTime: string;

  @IsNotEmpty()
  @IsString()
  roomId: string;
}
