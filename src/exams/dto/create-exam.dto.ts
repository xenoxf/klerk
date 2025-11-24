import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  examPrompt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  numberOfQuestions?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;
}
