import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateIncidentDto } from './dto/create-incident.dto.js';
import { Incident, IncidentStatus } from './entities/incident.entity.js';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
  ) {}

  async create(
    userId: string,
    data: CreateIncidentDto,
    imageUrl: string | null,
  ) {
    const incident = this.incidentRepo.create({
      title: data.title,
      description: data.description,
      roomId: data.roomId,
      userId,
      imageUrl,
    });
    return this.incidentRepo.save(incident);
  }

  findAll() {
    return this.incidentRepo.find({
      relations: { room: true, user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: IncidentStatus) {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    incident.status = status;
    return this.incidentRepo.save(incident);
  }
}
