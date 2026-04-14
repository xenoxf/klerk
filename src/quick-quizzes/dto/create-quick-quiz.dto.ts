import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';

enum Dificultad {
  VERY_EASY = 'very_easy',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  VERY_HARD = 'very_hard',
  EXPERT = 'expert',
}

export class CreateQuickQuizDto {
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título es requerido' })
  title: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'El tema debe ser un texto' })
  tema?: string;

  @IsOptional()
  @IsString({ message: 'El área debe ser un texto' })
  area?: string;

  @IsOptional()
  @IsEnum(Dificultad, {
    message:
      'La dificultad debe ser "very_easy", "easy", "medium", "hard", "very_hard" o "expert"',
  })
  difficulty?: Dificultad;

  @IsOptional()
  @IsString({ message: 'El acceso debe ser un texto' })
  acceso?: string;

  @IsOptional()
  @IsInt({ message: 'El total de preguntas debe ser un número entero' })
  @Min(1, { message: 'El total de preguntas debe ser al menos 1' })
  totalQuestions?: number;
}
