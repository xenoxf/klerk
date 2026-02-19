import { IsString, IsOptional, Min, Max, IsNumber } from 'class-validator';

export class FiltersDto {
  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser un texto' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'La categoría debe ser un texto' })
  category?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser al menos 1' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser al menos 1' })
  @Max(100, { message: 'El límite no puede exceder 100' })
  limit?: number;
}

// Alias para compatibilidad
export type FlashCardFiltersDto = FiltersDto;
export type CardFiltersDto = FiltersDto;