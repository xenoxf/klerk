import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser un texto' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'El contenido debe ser un texto' })
  content?: string;

  @IsOptional()
  @IsString({ message: 'La categoría debe ser un texto' })
  category?: string;
}
