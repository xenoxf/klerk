import { IsInt, IsString } from "class-validator";

export class RecordAttemptDto {
  @IsInt()
  examId: number;

  @IsInt()
  correctAnswers: number;

  @IsInt()
  totalQuestions: number;

  @IsString()
  examTitle: string;

}
