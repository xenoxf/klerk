import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('/junior')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health(): boolean {
    return true;
  }

  @Get('ping')
  ping(): string {
    return 'pong';
  }
}
