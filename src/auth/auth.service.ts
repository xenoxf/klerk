import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { MailService } from './mail.service';
//import { IsEmail } from 'class-validator';
//import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) { }

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
    try {
      await this.mailService.sendVerificationEmail(dto.email, token, dto.name);
    } catch (err) {
      throw new InternalServerErrorException({
        message: 'No se pudo enviar el correo de verificación.',
        emailSent: false,
      });
    }

    return {
      message: 'Te enviamos un correo para verificar tu email.',
      emailSent: true,
    };
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
    const tokenJwt = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      token: tokenJwt,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        sub: user.id,
      },
    };
  }

  /**
   * Register normal
   */
  async register(dto: CreateAuthDto) {
    const userExist = await this.usersService.findByEmail(dto.email);

    // Si existe → error
    if (userExist) {
      throw new BadRequestException('Usuario ya existe');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.createLocal({
      ...dto,
      password: hash,
    });

    if (!user) {
      throw new InternalServerErrorException("Hubo un error al crear usuario");
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    if (!token) {
      throw new InternalServerErrorException("Hubo un error al crear el token");
    }

    return {
      token,
      user: {
        sub: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture || null,
      },
    };
  }


  /**
   * 4️⃣ Login normal
   */
  async login(dto: LoginAuthDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) throw new UnauthorizedException('Credenciales incorrectas.');

    //if (!user.emailVerified)
    //  throw new UnauthorizedException('Debes verificar tu email primero.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas.');

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture || null,
        sub: user.id,
      },
    };
  }
  async getGoogleAuthUrl() {
    try {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;

      // Usa SIEMPRE el mismo callback que la GoogleStrategy
      const googleCallbackUrl = `${process.env.BACKEND_URL}/auth/google/callback`;

      const scope = encodeURIComponent('openid profile email');

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}` +
        `&redirect_uri=${encodeURIComponent(googleCallbackUrl)}` +
        `&response_type=code&scope=${scope}`;

      return { authUrl };
    } catch (error) {
      console.error('❌ Error generando Google Auth URL:', error);
      throw new BadRequestException('Error al generar URL de autenticación');
    }
  }

  verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return {
        valid: true,
        payload,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Token inválido',
      };
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
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: user.id,
      },
    };
  }
}
