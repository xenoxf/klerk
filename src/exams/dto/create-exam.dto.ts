import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  numberOfQuestions?: number;

  @IsOptional()
  @IsString()
  difficulty?: string;
}
