import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class GenerateNoteDto {
  @IsOptional()
    @IsString({ message: 'El título debe ser un texto' })
    @MinLength(3, { message: 'El título debe tener al menos 3 caracteres' })
    topic?: string;

    @IsOptional()
    @IsString({ message: 'El contenido debe ser un texto' })
    reference?: string;

    @IsInt({message: 'El número de notas debe ser un entero' })
    @Min(1)
    numberOfNotes?: number;

    @IsOptional()
    @IsString({message:"El nivel de detalle debe ser un texto"})
    levelOfDetail?: string;
}

