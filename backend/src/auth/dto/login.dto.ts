import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email/Mã không được để trống' })
  emailOrCode: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}
