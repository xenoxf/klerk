import {
  IsString,
  IsOptional,
  MinLength,
  Min,
  Max,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

enum Acceso {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export class GenerateExamDto {
  @IsNotEmpty({ message: 'Este campo debe ser obligatorio' })
  @IsString({ message: 'La referencia debe ser un texto' })
  @MinLength(3, { message: 'La referencia debe tener al menos 3 caracteres' })
  reference: string;

  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Max(10, { message: 'La cantidad no puede exceder 50' })
  numberOfQuestions: number;

  @MinLength(2, { message: 'La dificultad debe tener al manos 2 letras' })
  difficulty: string;

  @IsOptional()
  @IsEnum(Acceso, { message: 'El acceso debe ser "public" o "private"' })
  acceso: Acceso;
}
