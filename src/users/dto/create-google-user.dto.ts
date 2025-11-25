import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateGoogleUserDto {
  @IsEmail()
  email: string;

  @IsString()
  provider: string; // 'google'

  @IsString()
  providerId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  picture?: string;

  // Al registrarse con Google se asume email verificado
  emailVerified: boolean = true;
}
