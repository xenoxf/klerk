import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCardDto {
  @IsNotEmpty({ message: 'La pregunta es requerida' })
  @IsString({ message: 'La pregunta debe ser un texto' })
  @MinLength(3, { message: 'La pregunta debe tener al menos 3 caracteres' })
  question: string;

  @IsNotEmpty({ message: 'La respuesta es requerida' })
  @IsString({ message: 'La respuesta debe ser un texto' })
  @MinLength(3, { message: 'La respuesta debe tener al menos 3 caracteres' })
  answer: string;
}

export class CreateFlashCardDto {
  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString({ message: 'El título debe ser un texto' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsNotEmpty({ message: 'Las tarjetas son requeridas' })
  @IsArray({ message: 'Las tarjetas deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateCardDto)
  cards: CreateCardDto[];
}