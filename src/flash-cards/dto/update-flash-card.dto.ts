import { IsOptional, IsString } from 'class-validator';

export class UpdateFlashCardDto {
  @IsOptional()
  @IsString()
  front?: string;

  @IsOptional()
  @IsString()
  back?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
