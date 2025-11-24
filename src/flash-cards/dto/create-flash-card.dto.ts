import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFlashCardDto {
  @IsString()
  @IsNotEmpty()
  front: string;

  @IsString()
  @IsNotEmpty()
  back: string;

  @IsOptional()
  @IsString()
  description?: string;
}
