import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
  MinLength,
} from 'class-validator';

export class GenerateFlashCardsDto {
  @IsOptional()
  @IsString({ message: 'El tema debe ser un texto' })
  @MinLength(3, { message: 'El tema debe tener al menos 3 caracteres' })
  topic?: string;

  @IsOptional()
  @IsString({ message: 'El texto de referencia debe ser un texto' })
  @MinLength(10, {
    message: 'El texto de referencia debe tener al menos 10 caracteres',
  })
  referenceText?: string;

  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Max(50, { message: 'La cantidad no puede exceder 50' })
  quantity: number;

  @IsString({ message: 'El nivel debe ser un texto' })
  dificulty: string;
}
