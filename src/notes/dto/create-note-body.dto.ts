import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NoteContentItemDto {
  @IsOptional()
  @IsString({ message: 'El tema debe ser un texto' })
  tema?: string;

  @IsString({ message: 'El contenido debe ser un texto' })
  @IsNotEmpty({ message: 'El contenido es requerido' })
  content: string;

  @IsOptional()
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden debe ser mayor o igual a 0' })
  order?: number;
}

export class CreateNoteDto {
  @IsString({ message: 'El título debe ser un texto' })
  @IsNotEmpty({ message: 'El título es requerido' })
  title: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'El nivel de detalle debe ser un texto' })
  levelOfDetail?: string;

  @IsOptional()
  @IsString({ message: 'El acceso debe ser un texto' })
  acceso?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteContentItemDto)
  noteContents?: NoteContentItemDto[];
}
