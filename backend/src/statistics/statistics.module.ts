import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity.js';
import { Incident } from '../incidents/entities/incident.entity.js';
import { StatisticsController } from './statistics.controller.js';
import { StatisticsService } from './statistics.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Incident])],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
