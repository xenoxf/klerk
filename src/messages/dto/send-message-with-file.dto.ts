import { IsOptional, IsString, IsInt } from 'class-validator';

export class SendMessageWithFileDto {
  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @IsInt()
  chatId?: number;
}
