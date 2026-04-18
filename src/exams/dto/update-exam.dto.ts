import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';

enum Dificultad {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export class UpdateExamDto {
  @IsOptional()
  @IsInt({ message: 'El ID debe ser un número entero' })
  id?: number;

  @IsOptional()
  @IsString({ message: 'El título debe ser un texto' })
  title?: string;

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
    message: 'La dificultad debe ser "easy", "medium" o "hard"',
  })
  difficulty?: Dificultad;

  @IsOptional()
  @IsString({ message: 'El acceso debe ser un texto' })
  acceso?: string;

  @IsOptional()
  @IsInt({ message: 'El puntaje debe ser un número entero' })
  @Min(0, { message: 'El puntaje debe ser mayor o igual a 0' })
  score?: number;

  @IsOptional()
  userAnswers?: any;
}
