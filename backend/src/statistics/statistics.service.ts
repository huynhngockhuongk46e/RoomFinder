import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Booking,
  BookingStatus,
} from '../bookings/entities/booking.entity.js';
import {
  Incident,
  IncidentStatus,
} from '../incidents/entities/incident.entity.js';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
  ) {}

  async getOverview() {
    const totalBookings = await this.bookingRepo.count();

    const noShowBookings = await this.bookingRepo.count({
      where: { status: BookingStatus.NO_SHOW },
    });

    const totalIncidents = await this.incidentRepo.count();

    const pendingIncidents = await this.incidentRepo.count({
      where: { status: IncidentStatus.NEW },
    });

    const topRooms = await this.bookingRepo
      .createQueryBuilder('booking')
      .select('room.name', 'roomName')
      .addSelect('COUNT(booking.id)', 'bookingCount')
      .innerJoin('booking.room', 'room')
      .groupBy('room.id')
      .addGroupBy('room.name')
      .orderBy('bookingCount', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      totalBookings,
      noShowBookings,
      totalIncidents,
      pendingIncidents,
      topRooms: topRooms.map((room) => ({
        roomName: room.roomName,
        bookingCount: Number(room.bookingCount),
      })),
    };
  }
}
