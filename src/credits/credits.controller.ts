import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { CreditsService, CREDIT_CONFIG } from './credits.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';
import { AuthenticatedRequest } from '../common/types/request.type';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  /**
   * Obtiene el estado actual de créditos del usuario autenticado
   */
  @Get('/status')
  @UseGuards(JwtGuard, RequireAuthGuard)
  async getCreditsStatus(@Req() req: AuthenticatedRequest) {
    return this.creditsService.getCreditsStatus(getNumericUserId(req));
  }

  /**
   * Obtiene los costos de cada acción (endpoint público)
   */
  @Get('/costs')
  getCreditCosts() {
    return {
      costs: CREDIT_CONFIG.BASE_COSTS,
      multipliers: CREDIT_CONFIG.MULTIPLIERS,
      dailyCredits: CREDIT_CONFIG.DAILY_CREDITS,
    };
  }
}
