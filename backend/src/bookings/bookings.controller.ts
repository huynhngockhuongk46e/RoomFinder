import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { SearchRoomsDto } from './dto/search-rooms.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('search')
  searchRooms(@Query() query: SearchRoomsDto) {
    return this.bookingsService.searchEmptyRooms(query);
  }

  @Post()
  createBooking(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(userId, dto);
  }

  @Get('my-history')
  getMyBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.getMyBookings(userId);
  }

  @Patch(':id/cancel')
  cancelBooking(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.cancelBooking(userId, id);
  }

  @Patch(':id/check-in')
  checkIn(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.bookingsService.checkIn(userId, id);
  }

  @Patch(':id/end-early')
  endEarly(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.bookingsService.endEarly(userId, id);
  }

  @Patch(':id/extend')
  extendBooking(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('newEndTime') newEndTime: string,
  ) {
    return this.bookingsService.extendBooking(userId, id, newEndTime);
  }
}
