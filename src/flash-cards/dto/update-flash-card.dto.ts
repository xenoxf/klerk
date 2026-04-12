import { IsOptional, IsString } from 'class-validator';

export class UpdateFlashCardDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser un texto' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'El tema debe ser un texto' })
  tema?: string;

  @IsOptional()
  @IsString({ message: 'El área debe ser un texto' })
  area?: string;

  @IsOptional()
  @IsString({ message: 'El acceso debe ser un texto' })
  acceso?: string;
}
