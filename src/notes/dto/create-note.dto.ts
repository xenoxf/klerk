import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateNoteDto {
    @IsNotEmpty({ message: 'El título es requerido' })
    @IsString({ message: 'El título debe ser un texto' })
    @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
    @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
    title: string;

    @IsOptional()
    @IsString({ message: 'El contenido debe ser un texto' })
    content?: string;

    @IsOptional()
    @IsString({ message: 'La categoría debe ser un texto' })
    category?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    numberOfNotes?: number;

    @IsOptional()
    @IsString()
    levelOfDetail?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    tema?: string;

    @IsOptional()
    @IsString()
    textoReferencia?: string;
}

export class GenerateNoteDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  referenceText?: string;

  @IsOptional()
  @IsString()
  color?: string;
}
