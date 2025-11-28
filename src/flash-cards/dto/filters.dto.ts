// filepath: /home/juniorxf/proyectos/klerk/src/flash-cards/dto/filters.dto.ts

export class CardFiltersDto {
  search?: string;
  sort?: 'newest' | 'oldest' | 'mostReviewed' | 'leastReviewed' = 'newest';
  page?: number = 1;
  limit?: number = 20;
}

export class FlashCardFiltersDto {
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  reviewed?: boolean;
  search?: string;
  sort?: 'newest' | 'oldest' | 'byDifficulty' | 'mostReviewed' = 'newest';
  page?: number = 1;
  limit?: number = 20;
}