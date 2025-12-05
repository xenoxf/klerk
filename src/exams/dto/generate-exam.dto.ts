export class GenerateExamDto {
  
  topic?: string;
  referenceText?: string;
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
}