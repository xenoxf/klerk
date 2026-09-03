import { Injectable } from '@nestjs/common';
import { ExamsService } from './exams/exams.service';

@Injectable()
export class AppService {
  constructor(private readonly examService: ExamsService) { }
  getHello(): string {
    return 'Hola junior estas bien';
  }

  async heyDb(): Promise<boolean> {
    return this.examService
      .getPublicExamsDeck()
      .then(() => {
        return true;
      })
      .catch(() => {
        return false;
      });
  }
}
