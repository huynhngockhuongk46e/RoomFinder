import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { Room } from './entities/room.entity.js';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room) private readonly repo: Repository<Room>,
  ) {}

  async create(dto: CreateRoomDto) {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new BadRequestException('Tên phòng đã tồn tại');
    }
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const room = await this.repo.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    return room;
  }

  async update(id: string, dto: UpdateRoomDto) {
    const room = await this.findOne(id);
    if (dto.name !== undefined && dto.name !== room.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) {
        throw new BadRequestException('Tên phòng đã tồn tại');
      }
    }
    Object.assign(room, dto);
    return this.repo.save(room);
  }

  async remove(id: string) {
    const room = await this.findOne(id);
    await this.repo.remove(room);
    return { message: 'Xóa phòng thành công' };
  }
}
