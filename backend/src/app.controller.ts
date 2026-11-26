import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js'; // Chú ý đuôi .js

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET /api
  @Get()
  getInfo() {
    return {
      name: 'Room Finder API',
      version: '0.1.0',
      status: 'running',
    };
  }

  // GET /api/health
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}