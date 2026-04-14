import {
  IsString,
  IsOptional,
  MinLength,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

export class GenerateQuickQuizDto {
  @IsNotEmpty({ message: 'Este campo debe ser obligatorio' })
  @IsString({ message: 'El tema debe ser un texto' })
  @MinLength(3, { message: 'El tema debe tener al menos 3 caracteres' })
  topic: string;

  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Max(20, { message: 'La cantidad no puede exceder 20' })
  numberOfQuestions: number;

  @MinLength(2, { message: 'La dificultad debe tener al menos 2 letras' })
  difficulty: string;

  @IsOptional()
  @IsString({ message: 'El acceso debe ser un texto' })
  acceso?: string;
}
