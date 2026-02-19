import { IsString, IsOptional, MinLength, MaxLength, Min, Max } from 'class-validator';

export class UpdateExamDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser un texto' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  @Min(1, { message: 'El número de preguntas debe ser al menos 1' })
  @Max(100, { message: 'El número de preguntas no puede exceder 100' })
  questionCount?: number;
}
