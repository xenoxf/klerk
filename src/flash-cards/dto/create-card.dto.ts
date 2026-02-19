/**
 * DEPRECATED: Este DTO no se usa actualmente.
 * Se recomienda eliminar y usar CreateFlashCardDto en su lugar.
 * @deprecated
 */
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateCardDto {
  @IsNotEmpty({ message: 'La pregunta es requerida' })
  @IsString({ message: 'La pregunta debe ser un texto' })
  @MinLength(5, { message: 'La pregunta debe tener al menos 5 caracteres' })
  question: string;

  @IsNotEmpty({ message: 'La respuesta es requerida' })
  @IsString({ message: 'La respuesta debe ser un texto' })
  @MinLength(5, { message: 'La respuesta debe tener al menos 5 caracteres' })
  answer: string;
}
