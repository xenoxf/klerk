import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty({ message: 'El contenido del mensaje es requerido' })
  @IsString({ message: 'El contenido debe ser un texto' })
  @MinLength(1, { message: 'El mensaje no puede estar vacío' })
  prompt: string;

  @IsOptional()
  @IsString({ message: 'El ID del chat debe ser un número' })
  chatId?: string | number;
}

export class SendMessageWithAIDto {
  prompt: string;
  chatId?: number;
}
