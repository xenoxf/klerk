import { IsEmail, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateGoogleUserDto {
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  name: string;

  @IsString({ message: 'El googleId debe ser un texto' })
  googleId: string;

  @IsOptional()
  @IsString({ message: 'La foto debe ser un URL válido' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: 'La imagen debe ser un URL válido' })
  picture?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña debe ser un texto' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'El providerId debe ser un texto' })
  providerId?: string;

  @IsString({ message: 'El proveedor debe ser un texto' })
  provider: string;
}
