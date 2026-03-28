import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsEnum,
  Max,
  ValidateIf,
} from 'class-validator';

enum Acceso {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

/** Payload POST /notes/generate/topic_or_reference */
export class GenerateNoteDto {
  /** Texto largo de referencia (prioridad si viene) */
  @IsOptional()
  @IsString()
  reference?: string;

  /** Tema corto (alternativa a reference) */
  @IsOptional()
  @IsString()
  topic?: string;

  /** Alias usado por algunos clientes */
  @IsOptional()
  @IsString()
  referenceText?: string;

  @ValidateIf((o) => o.numberOfNotes != null)
  @IsInt()
  @Min(1)
  @Max(20)
  numberOfNotes?: number;

  @IsOptional()
  @IsString()
  levelOfDetail?: string;

  @IsOptional()
  @IsEnum(Acceso, { message: 'El acceso debe ser "public" o "private"' })
  acceso?: Acceso;
}
