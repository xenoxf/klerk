import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
  MinLength,
  IsEnum,
} from 'class-validator';

enum Acceso {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export class GenerateFlashCardsDto {
  @IsNotEmpty({ message: 'El texto de referencia es obligatorio' })
  @IsString({ message: 'El texto de referencia debe ser un texto' })
  @MinLength(3, {
    message: 'El texto de referencia debe tener al menos 3 caracteres',
  })
  reference: string;

  @IsNotEmpty({ message: 'La cantidad es obligatoria' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Max(50, { message: 'La cantidad no puede exceder 50' })
  quantity: number;

  @IsOptional()
  @IsEnum(Acceso, { message: 'El acceso debe ser "public" o "private"' })
  acceso: Acceso;
}

