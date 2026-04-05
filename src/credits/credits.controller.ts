import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { CreditsService, CREDIT_CONFIG } from './credits.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from 'src/common/guards/require-auth/require-auth.guard';

@UseGuards(RequireAuthGuard, JwtGuard)
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  /**
   * Obtiene el estado actual de créditos del usuario autenticado
   */
  @Get('/status')
  async getCreditsStatus(@Req() req: any) {
    return this.creditsService.getCreditsStatus(req.user.id);
  }

  /**
   * Obtiene los costos de cada acción (para que el frontend las muestre)
   */
  @Get('/costs')
  getCreditCosts() {
    return {
      costs: CREDIT_CONFIG.COSTS,
      dailyCredits: CREDIT_CONFIG.DAILY_CREDITS,
    };
  }
}
