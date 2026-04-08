import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardLike } from './entities/card-like.entity';

export type CardType = 'exam' | 'card' | 'note';

@Injectable()
export class LikesService {
  private readonly logger = new Logger(LikesService.name);

  constructor(
    @InjectRepository(CardLike)
    private likesRepo: Repository<CardLike>,
  ) {}

  async toggleLike(userId: number, cardType: CardType, cardId: number): Promise<{ liked: boolean; count: number }> {
    const existing = await this.likesRepo.findOne({
      where: { userId, cardType, cardId },
    });

    if (existing) {
      await this.likesRepo.delete(existing.id);
      this.logger.log(`User ${userId} unliked ${cardType} ${cardId}`);
    } else {
      try {
        const like = this.likesRepo.create({ userId, cardType, cardId });
        await this.likesRepo.save(like);
        this.logger.log(`User ${userId} liked ${cardType} ${cardId}`);
      } catch (error: any) {
        // Handle unique constraint race condition
        if (error.code === '23505') { // PostgreSQL unique violation
          this.logger.warn(`Race condition: duplicate like for user ${userId} ${cardType} ${cardId}`);
        } else {
          throw error;
        }
      }
    }

    const count = await this.getLikeCount(cardType, cardId);
    const liked = !existing;

    return { liked, count };
  }

  async getLikeCount(cardType: CardType, cardId: number): Promise<number> {
    return this.likesRepo.count({ where: { cardType, cardId } });
  }

  async hasUserLiked(userId: number, cardType: CardType, cardId: number): Promise<boolean> {
    const existing = await this.likesRepo.findOne({
      where: { userId, cardType, cardId },
    });
    return !!existing;
  }

  async getLikeCountsForCards(cardType: CardType, cardIds: number[]): Promise<Map<number, number>> {
    if (cardIds.length === 0) return new Map();

    const results = await this.likesRepo
      .createQueryBuilder('like')
      .select('like.cardId', 'cardId')
      .addSelect('COUNT(*)', 'count')
      .where('like.cardType = :cardType', { cardType })
      .andWhere('like.cardId IN (:...cardIds)', { cardIds })
      .groupBy('like.cardId')
      .getRawMany();

    const map = new Map<number, number>();
    for (const result of results) {
      map.set(Number(result.cardId), Number(result.count));
    }
    return map;
  }

  async getUserLikedCards(cardType: CardType, userId: number, cardIds: number[]): Promise<Set<number>> {
    if (cardIds.length === 0) return new Set();

    const results = await this.likesRepo
      .createQueryBuilder('like')
      .select('like.cardId', 'cardId')
      .where('like.cardType = :cardType', { cardType })
      .andWhere('like.userId = :userId', { userId })
      .andWhere('like.cardId IN (:...cardIds)', { cardIds })
      .getRawMany();

    const set = new Set<number>();
    for (const result of results) {
      set.add(Number(result.cardId));
    }
    return set;
  }
}
