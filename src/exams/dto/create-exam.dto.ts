import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, Min, Max, IsIn } from 'class-validator';

export class CreateExamDto {
  @IsOptional()
  @IsString({ message: 'El tema debe ser un texto' })
  @MinLength(3, { message: 'El tema debe tener al menos 3 caracteres' })
  topic?: string;

  @IsOptional()
  @IsString({ message: 'La referencia debe ser un texto' })
  @MinLength(10, { message: 'La referencia debe tener al menos 10 caracteres' })
  reference?: string;

  @IsNotEmpty({ message: 'El número de preguntas es requerido' })
  @Min(1, { message: 'El número de preguntas debe ser al menos 1' })
  @Max(50, { message: 'El número de preguntas no puede exceder 50' })
  numberOfQuestions: number;

  @IsNotEmpty({ message: 'La dificultad es requerida' })
  @IsIn(['easy', 'medium', 'hard'], { message: 'La dificultad debe ser easy, medium o hard' })
  difficulty: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;
}
