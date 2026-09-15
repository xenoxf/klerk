import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { SearchService } from './search.service';
import { AuthenticatedRequest } from '../common/types/request.type';
import { getNumericUserId } from '../common/utils/shared.utils';

@UseGuards(JwtGuard, RequireAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('global')
  async globalSearch(
    @Req() req: AuthenticatedRequest,
    @Query('q') q = '',
    @Query('limit') limit = '6',
  ) {
    return this.searchService.globalSearch(q, getNumericUserId(req), Number(limit) || 6);
  }
}
