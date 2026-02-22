import { IsString, MinLength, MaxLength, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCardDto } from './create-flash-card.dto';

export class UpdateFlashCardDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser un texto' })
  @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'Las tarjetas deben ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateCardDto)
  cards?: CreateCardDto[];
}