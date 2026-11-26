import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { User } from './users/entities/user.entity.js';
import { UsersModule } from './users/users.module.js';
import { Room } from './rooms/entities/room.entity.js';
import { RoomsModule } from './rooms/rooms.module.js';
import { Schedule } from './schedules/entities/schedule.entity.js';
import { SchedulesModule } from './schedules/schedules.module.js';
import { Booking } from './bookings/entities/booking.entity.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { Incident } from './incidents/entities/incident.entity.js';
import { IncidentsModule } from './incidents/incidents.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';

@Module({
  imports: [
    // 1. Cấu hình đọc file .env toàn cục
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 2. Cấu hình kết nối MySQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USER', 'root'),
        password: configService.get<string>('DB_PASS', ''),
        database: configService.get<string>('DB_NAME', 'databasephonghoc'),
        entities: [User, Room, Schedule, Booking, Incident],
        synchronize: true, // Tự động đồng bộ bảng (chỉ dùng khi dev)
        charset: 'utf8mb4',
      }),
    }),
    AuthModule,
    UsersModule,
    RoomsModule,
    SchedulesModule,
    BookingsModule,
    IncidentsModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}