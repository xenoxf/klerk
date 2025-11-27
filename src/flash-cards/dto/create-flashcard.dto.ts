import { IsString, IsOptional, IsArray, IsEnum, IsNumber } from 'class-validator';

export class CreateFlashcardDto {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsString()
  hint?: string;

  @IsEnum(['easy', 'medium', 'hard'])
  difficulty: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsNumber()
  cardId: number;
}
