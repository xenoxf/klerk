import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FlashcardItemDto {
  @IsString({ message: 'El frente debe ser un texto' })
  @IsNotEmpty({ message: 'El frente es requerido' })
  front: string;

  @IsString({ message: 'El reverso debe ser un texto' })
  @IsNotEmpty({ message: 'El reverso es requerido' })
  back: string;

  @IsOptional()
  @IsString({ message: 'La pista debe ser un texto' })
  hint?: string;
}

export class CreateFlashCardDto {
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título es requerido' })
  title: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'El tema debe ser un texto' })
  tema?: string;

  @IsOptional()
  @IsString({ message: 'El área debe ser un texto' })
  area?: string;

  @IsOptional()
  @IsString({ message: 'El acceso debe ser un texto' })
  acceso?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashcardItemDto)
  flashcards?: FlashcardItemDto[];
}
