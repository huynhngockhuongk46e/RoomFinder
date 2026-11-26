import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';
import { Role } from '../common/enums/role.enum.js';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findAll(search?: string) {
    const query = this.repo.createQueryBuilder('u');
    if (search) {
      query.where(
        'u.fullName LIKE :search OR u.email LIKE :search OR u.userCode LIKE :search',
        { search: `%${search}%` },
      );
    }
    return query.orderBy('u.createdAt', 'DESC').getMany();
  }

  async findOne(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);

    if (dto.email !== undefined && dto.email !== user.email) {
      const emailExists = await this.repo.findOne({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new BadRequestException('Email đã được sử dụng bởi người khác');
      }
      user.email = dto.email;
    }

    if (dto.userCode !== undefined && dto.userCode !== user.userCode) {
      const codeExists = await this.repo.findOne({
        where: { userCode: dto.userCode },
      });
      if (codeExists) {
        throw new BadRequestException('Mã sinh viên/giảng viên đã tồn tại');
      }
      user.userCode = dto.userCode;
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.password !== undefined && dto.password.length > 0) {
      user.password = await bcrypt.hash(dto.password, 10);
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
      if (dto.isActive) {
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
      }
    }

    return this.repo.save(user);
  }

  async toggleLock(id: string) {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    if (user.isActive) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }
    return this.repo.save(user);
  }

  async updateRole(id: string, role: Role) {
    const user = await this.findOne(id);
    user.role = role;
    return this.repo.save(user);
  }
}
