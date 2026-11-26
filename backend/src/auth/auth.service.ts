import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { MailService } from '../common/mail/mail.service.js';
import { User } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwt: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepo.findOne({
      where: [{ email }, { userCode: dto.userCode }],
    });
    if (existing) {
      throw new BadRequestException('Email hoặc Mã người dùng đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      email,
      password: hashedPassword,
    });
    await this.userRepo.save(user);

    return { message: 'Đăng ký thành công, bạn có thể đăng nhập ngay' };
  }

  async login(dto: LoginDto) {
    const login = dto.emailOrCode.trim();
    const normalizedEmail = login.toLowerCase();
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('LOWER(u.email) = :normalizedEmail OR u.userCode = :userCode', {
        normalizedEmail,
        userCode: login,
      })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng');
    }

    const token = this.jwt.sign({ sub: user.id, role: user.role });
    const { password: _password, ...safeUser } = user;
    return { accessToken: token, user: safeUser };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepo.findOne({
      where: { email: normalizedEmail },
    });
    if (!user) {
      return { message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn.' };
    }

    const token = randomBytes(3).toString('hex').toUpperCase();
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await this.userRepo.save(user);

    await this.mailService.sendPasswordResetEmail(user.email, token);
    return {
      message: 'Mã khôi phục đã được gửi vào Email của bạn!',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect(['u.resetPasswordToken', 'u.resetPasswordExpires'])
      .where('u.resetPasswordToken = :token', { token })
      .getOne();

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Mã khôi phục không hợp lệ hoặc đã hết hạn');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepo.save(user);
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.userRepo
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    user.password = await bcrypt.hash(newPass, 10);
    await this.userRepo.save(user);
    return { message: 'Đổi mật khẩu thành công' };
  }
}
