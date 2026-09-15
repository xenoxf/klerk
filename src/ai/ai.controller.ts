import { Controller, Get, Post, Put, Body, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { AiService } from './ai.service';
import { UpdateAiConfigDto, TestAiConfigDto } from './dto/update-ai-config.dto';
import { AuthenticatedRequest } from '../common/types/request.type';
import { getNumericUserId } from '../common/utils/shared.utils';

@UseGuards(JwtGuard, RequireAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('providers')
  getProviders() {
    return this.aiService.getProviders();
  }

  @Get('config')
  getConfig(@Req() req: AuthenticatedRequest) {
    return this.aiService.getConfig(getNumericUserId(req));
  }

  @Put('config')
  updateConfig(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateAiConfigDto,
  ) {
    return this.aiService.updateConfig(getNumericUserId(req), dto);
  }

  @Post('config/test')
  testConfig(@Body() dto: TestAiConfigDto) {
    return this.aiService.testConnection(dto);
  }
}
