import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GenerateNoteDto {
  @IsString({ message: 'Debe ser un string' })
  reference: string;

  @IsInt({ message: 'El número de notas debe ser un entero' })
  @Min(1)
  numberOfNotes?: number;

  @IsOptional()
  @IsString({ message: 'El nivel de detalle debe ser un texto' })
  levelOfDetail?: string;
}
