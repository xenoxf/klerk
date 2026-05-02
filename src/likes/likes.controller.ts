import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';
import { getNumericUserId } from '../common/utils/shared.utils';
import { AuthenticatedRequest } from '../common/types/request.type';

@UseGuards(JwtGuard)
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('exams/:id')
  @UseGuards(RequireAuthGuard)
  async toggleExamLike(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.likesService.toggleLike(getNumericUserId(req), 'exam', id);
  }

  @Post('flashcards/:id')
  @UseGuards(RequireAuthGuard)
  async toggleFlashcardLike(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.likesService.toggleLike(getNumericUserId(req), 'card', id);
  }

  @Post('notes/:id')
  @UseGuards(RequireAuthGuard)
  async toggleNoteLike(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.likesService.toggleLike(getNumericUserId(req), 'note', id);
  }

  @Get('exams/:id')
  async getExamLikes(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getOptionalNumericUserId(req);
    const count = await this.likesService.getLikeCount('exam', id);
    const userLiked = userId
      ? await this.likesService.hasUserLiked(userId, 'exam', id)
      : false;
    return { count, userLiked };
  }

  @Get('flashcards/:id')
  async getFlashcardLikes(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getOptionalNumericUserId(req);
    const count = await this.likesService.getLikeCount('card', id);
    const userLiked = userId
      ? await this.likesService.hasUserLiked(userId, 'card', id)
      : false;
    return { count, userLiked };
  }

  @Get('notes/:id')
  async getNoteLikes(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getOptionalNumericUserId(req);
    const count = await this.likesService.getLikeCount('note', id);
    const userLiked = userId
      ? await this.likesService.hasUserLiked(userId, 'note', id)
      : false;
    return { count, userLiked };
  }
}
