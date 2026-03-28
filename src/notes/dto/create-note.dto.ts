import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsEnum,
} from 'class-validator';
enum Acceso {
  PUBLIC = 'public',
  PRIVATE = 'private',
}
export class GenerateNoteDto {
  @IsNotEmpty({ message: 'Este campo debe ser obligatorio' })
  @IsString({ message: 'Debe ser un string' })
  reference: string;

  @IsInt({ message: 'El número de notas debe ser un entero' })
  @Min(1)
  numberOfNotes?: number;

  @IsOptional()
  @IsString({ message: 'El nivel de detalle debe ser un texto' })
  levelOfDetail?: string;

  @IsOptional()
  @IsEnum(Acceso, { message: 'El acceso debe ser "public" o "private"' })
  acceso: Acceso;
}
