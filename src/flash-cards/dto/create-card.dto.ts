import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCardDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
