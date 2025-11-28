import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateFlashCardDto {
  question: string;

  answer: string;

  cardId: number;

  difficulty?: 'easy' | 'medium' | 'hard';

  hint?: string;

  tags?: string[];
}

export class UpdateFlashCardDto {
  question?: string;

  answer?: string;

  difficulty?: 'easy' | 'medium' | 'hard';

  hint?: string;

  tags?: string[];
}

export class CreateCardDto {
  title: string;
  description?: string;
}

export class UpdateCardDto {
  title?: string;
  description?: string;
}
