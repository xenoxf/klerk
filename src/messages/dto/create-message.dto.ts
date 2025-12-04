import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsString()
  chatId?: string | number;
}

export class SendMessageWithAIDto {
  prompt: string;
  chatId?: number;
}
