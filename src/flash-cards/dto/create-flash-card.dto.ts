import { IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';

export class GenerateFlashcardsDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  referenceText?: string;

  @IsNumber()
  @Min(1)
  @Max(50)
  numberOfCards: number;

  @IsString()
  @IsIn(['fácil', 'medio', 'difícil'])
  difficulty: 'fácil' | 'medio' | 'difícil';

  @IsNumber()
  userId: number;
}
