import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  Min,
  Max,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateFlashCardDto {
  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString({ message: 'El título debe ser un texto' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsNotEmpty({ message: 'Las tarjetas son requeridas' })
  cards: Array<{
    question: string;
    answer: string;
  }>;
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
