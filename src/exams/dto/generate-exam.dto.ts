import { IsString, IsOptional, MinLength, Min, Max, IsIn } from 'class-validator';

export class GenerateExamDto {
  @IsOptional()
  @IsString({ message: 'El tema debe ser un texto' })
  @MinLength(3, { message: 'El tema debe tener al menos 3 caracteres' })
  topic?: string;

  @IsOptional()
  @IsString({ message: 'La referencia debe ser un texto' })
  @MinLength(10, { message: 'La referencia debe tener al menos 10 caracteres' })
  reference?: string;

  @IsOptional()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Max(50, { message: 'La cantidad no puede exceder 50' })
  numberOfQuestions?: number;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'], { message: 'La dificultad debe ser easy, medium o hard' })
  difficulty?: 'easy' | 'medium' | 'hard';
}