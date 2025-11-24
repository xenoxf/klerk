import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  numberOfQuestions?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;
}
