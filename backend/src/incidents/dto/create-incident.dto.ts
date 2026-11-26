import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateIncidentDto {
  @IsNotEmpty({ message: 'Tiêu đề sự cố không được để trống' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Mô tả sự cố không được để trống' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Phòng bị sự cố không được để trống' })
  @IsUUID()
  roomId: string;
}
