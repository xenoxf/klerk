import { IsOptional, IsString } from 'class-validator';

export class UpdateMessageDto {
  @IsOptional()
  @IsString()
  mensaje?: string;

  @IsOptional()
  @IsString()
  response?: string;
}
