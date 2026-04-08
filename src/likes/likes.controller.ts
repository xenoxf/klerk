import { Controller, Post, Get, Param, ParseIntPipe, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { LikesService, CardType } from './likes.service';
import { JwtGuard } from '../auth/jwt/jwt.guard';
import { RequireAuthGuard } from '../common/guards/require-auth/require-auth.guard';

function getNumericUserId(req: any): number {
  const userId = Number(req.user?.id);
  if (isNaN(userId)) {
    throw new ForbiddenException('Acceso no permitido');
  }
  return userId;
}

@UseGuards(JwtGuard)
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('exams/:id')
  @UseGuards(RequireAuthGuard)
  async toggleExamLike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.likesService.toggleLike(getNumericUserId(req), 'exam', id);
  }

  @Post('flashcards/:id')
  @UseGuards(RequireAuthGuard)
  async toggleFlashcardLike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.likesService.toggleLike(getNumericUserId(req), 'card', id);
  }

  @Post('notes/:id')
  @UseGuards(RequireAuthGuard)
  async toggleNoteLike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.likesService.toggleLike(getNumericUserId(req), 'note', id);
  }

  @Get('exams/:id')
  async getExamLikes(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req?.user?.id ? Number(req.user.id) : undefined;
    const count = await this.likesService.getLikeCount('exam', id);
    const userLiked = userId ? await this.likesService.hasUserLiked(userId, 'exam', id) : false;
    return { count, userLiked };
  }

  @Get('flashcards/:id')
  async getFlashcardLikes(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req?.user?.id ? Number(req.user.id) : undefined;
    const count = await this.likesService.getLikeCount('card', id);
    const userLiked = userId ? await this.likesService.hasUserLiked(userId, 'card', id) : false;
    return { count, userLiked };
  }

  @Get('notes/:id')
  async getNoteLikes(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const userId = req?.user?.id ? Number(req.user.id) : undefined;
    const count = await this.likesService.getLikeCount('note', id);
    const userLiked = userId ? await this.likesService.hasUserLiked(userId, 'note', id) : false;
    return { count, userLiked };
  }
}
