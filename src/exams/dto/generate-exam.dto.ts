import {
  IsString,
  IsOptional,
  MinLength,
  Min,
  Max,
  IsIn,
  IsEnum,
} from 'class-validator';

enum Acceso {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export class GenerateExamDto {
  @IsOptional()
  @IsString({ message: 'El tema debe ser un texto' })
  @MinLength(3, { message: 'El tema debe tener al menos 3 caracteres' })
  topic?: string;

  @IsOptional()
  @IsString({ message: 'La referencia debe ser un texto' })
  @MinLength(10, { message: 'La referencia debe tener al menos 10 caracteres' })
  reference?: string;

  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Max(50, { message: 'La cantidad no puede exceder 50' })
  numberOfQuestions: number;

  @IsIn(['facil', 'medio', 'dificil'], {
    message: 'La dificultad debe ser facil, medio o dificil',
  })
  difficulty: string;

  @IsOptional()
    @IsEnum(Acceso, {message: 'El acceso debe ser "public" o "private"'})
    acceso: Acceso;
}
