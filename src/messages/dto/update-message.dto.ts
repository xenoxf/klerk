import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateMessageDto {
  @IsOptional()
  @IsString({ message: 'El contenido debe ser un texto' })
  @MinLength(1, { message: 'El mensaje no puede estar vacío' })
  content?: string;
}
