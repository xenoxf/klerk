/**
 * DEPRECATED: Este DTO no se usa actualmente.
 * Se recomienda eliminar y usar UpdateFlashCardDto en su lugar.
 * @deprecated
 */
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateCardDto {
  @IsOptional()
  @IsString({ message: 'La pregunta debe ser un texto' })
  @MinLength(5, { message: 'La pregunta debe tener al menos 5 caracteres' })
  question?: string;

  @IsOptional()
  @IsString({ message: 'La respuesta debe ser un texto' })
  @MinLength(5, { message: 'La respuesta debe tener al menos 5 caracteres' })
  answer?: string;
}
