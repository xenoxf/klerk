import { IsInt } from 'class-validator';

export class UpdateExamDto {
  @IsInt()
  id: number;
  @IsInt()
  score: number;
}
