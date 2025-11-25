import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from 'src/users/users.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  /**
   * 1️⃣ El usuario envía nombre, email y contraseña por primera vez.
   * -> NO se crea el usuario.
   * -> Solo se valida y se envía email.
   */
  async preRegister(dto: CreateAuthDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists)
      throw new BadRequestException('Este correo ya está registrado.');

    // Creamos un token temporal (con los datos pero NO creamos usuario)
    const token = this.jwtService.sign(
      {
        email: dto.email,
        name: dto.name,
        password: dto.password, // luego lo hashamos
      },
      { expiresIn: '15m' },
    );

    await this.mailService.sendVerificationEmail(dto.email, token);

    return { message: 'Te enviamos un correo para verificar tu email.' };
  }

  /**
   * 2️⃣ El enlace del correo llega aquí y confirmamos que el token está OK
   */
  async verifyEmailToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      return {
        valid: true,
        email: payload.email,
        name: payload.name,
        password: payload.password,
      };
    } catch (error) {
      throw new BadRequestException('Token inválido o expirado.');
    }
  }

  /**
   * 3️⃣ Ahora sí CREAR usuario (después de verificar email)
   */
  async registerWithVerifiedData(token: string) {
    let payload;

    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new BadRequestException('Token inválido o expirado.');
    }

    const exists = await this.usersService.findByEmail(payload.email);
    if (exists) {
      throw new BadRequestException('Este correo ya está registrado.');
    }

    const hashed = await bcrypt.hash(payload.password, 10);

    const user = await this.usersService.createLocal({
      email: payload.email,
      name: payload.name,
      password: hashed,
      emailVerified: true,
    });

    if (!user) throw new InternalServerErrorException('Error creando usuario.');

    return { message: 'Usuario creado exitosamente', user };
  }

  /**
   * 4️⃣ Login normal
   */
  async login(dto: LoginAuthDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) throw new UnauthorizedException('Credenciales incorrectas.');

    if (!user.emailVerified)
      throw new UnauthorizedException('Debes verificar tu email primero.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas.');

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      token,
      email: user.email,
      name: user.name,
      sub: user.id,
    };
  }

  verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return { valid: true, payload };
    } catch (err) {
      return { valid: false, err };
    }
  }

  /**
 * 5️⃣ Login con Google (datos vienen desde GoogleStrategy → req.user)
 */
async loginWithGoogle(googleUser: any) {
  // googleUser viene desde GoogleStrategy:
  // { id, email, name, picture, provider, providerId }

  let user = await this.usersService.findByEmail(googleUser.email);

  // Si no existe lo creamos automáticamente
  if (!user) {
    user = await this.usersService.createGoogle({
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      provider: 'google',
      providerId: googleUser.providerId,
      emailVerified: true,
    });
  }

  // Generar token
  const token = this.jwtService.sign({
    sub: user.id,
    email: user.email,
  });

  return {
    token,
    email: user.email,
    name: user.name,
    picture: user.picture,
    sub: user.id,
  };
}

}
