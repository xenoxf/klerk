import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateGlobalChatMessageDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  content: string;
}
