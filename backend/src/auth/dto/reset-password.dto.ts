import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Mã khôi phục không được để trống' })
  token: string;

  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự' })
  newPassword: string;
}
