import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

import { UsersService } from '../users/users.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { MailService } from './mail.service';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Método auxiliar para crear JWT token
   */
  private generateAuthToken(user: any) {
    return this.jwtService.sign(
      { 
        sub: user.id, 
        email: user.email,
        type: 'access' 
      },
      { expiresIn: '7d' }
    );
  }

  /**
   * Método auxiliar para validar email único
   */
  private async validateUniqueEmail(email: string): Promise<void> {
    const exists = await this.usersService.findByEmail(email);
    if (exists) {
      throw new BadRequestException('Este correo ya está registrado.');
    }
  }

  /**
   * 1️⃣ Pre-registro con verificación de email
   */
  async preRegister(dto: CreateAuthDto) {
    await this.validateUniqueEmail(dto.email);

    // Crear token temporal (expira en 15 minutos)
    const token = this.jwtService.sign(
      {
        email: dto.email,
        name: dto.name,
        password: dto.password,
        purpose: 'email-verification',
      },
      { expiresIn: '15m' },
    );

    try {
      await this.mailService.sendVerificationEmail(dto.email, token, dto.name);
      
      this.logger.log(`Email de verificación enviado a: ${dto.email}`);
      
      return {
        message: 'Te enviamos un correo para verificar tu email.',
        emailSent: true,
      };
    } catch (err) {
      this.logger.error(`Error enviando email a ${dto.email}:`, err);
      
      throw new InternalServerErrorException({
        message: 'No se pudo enviar el correo de verificación.',
        emailSent: false,
      });
    }
  }

  /**
   * 2️⃣ Verificar token de email
   */
  async verifyEmailToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      
      if (payload.purpose !== 'email-verification') {
        throw new BadRequestException('Token inválido para este propósito.');
      }

      return {
        valid: true,
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      this.logger.error('Error verificando token:', error);
      throw new BadRequestException('Token inválido o expirado.');
    }
  }

  /**
   * 3️⃣ Crear usuario con datos verificados
   */
  async registerWithVerifiedData(token: string) {
    let payload;
    
    try {
      payload = this.jwtService.verify(token);
      
      if (payload.purpose !== 'email-verification') {
        throw new BadRequestException('Token inválido para este propósito.');
      }
    } catch (err) {
      throw new BadRequestException('Token inválido o expirado.');
    }

    await this.validateUniqueEmail(payload.email);

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const user = await this.usersService.createLocal({
      email: payload.email,
      name: payload.name,
      password: hashedPassword,
      emailVerified: true,
    });

    if (!user) {
      throw new InternalServerErrorException('Error creando usuario.');
    }

    const tokenJwt = this.generateAuthToken(user);

    return {
      token: tokenJwt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * 4️⃣ Registro directo (sin verificación)
   */
  async register(dto: CreateAuthDto) {
    await this.validateUniqueEmail(dto.email);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.createLocal({
      ...dto,
      password: hashedPassword,
      emailVerified: false, // Considerar si quieres verificar email aquí también
    });

    if (!user) {
      throw new InternalServerErrorException('Hubo un error al crear usuario');
    }

    const token = this.generateAuthToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture || null,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * 5️⃣ Login normal
   */
  async login(dto: LoginAuthDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // Validar si el usuario usa autenticación local
    if (!user.password) {
      throw new UnauthorizedException('Este email está registrado con otro método de autenticación.');
    }

    // Opcional: verificar email
    // if (!user.emailVerified) {
    //   throw new UnauthorizedException('Debes verificar tu email primero.');
    // }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const token = this.generateAuthToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture || null,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * 6️⃣ Login con Google (callback)
   */
  async loginWithGoogle(googleUser: any) {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      user = await this.usersService.createGoogle({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        providerId: googleUser.providerId,
        emailVerified: true,
        provider: 'google',
      });
    }

    const token = this.generateAuthToken(user);

    return { token, user };
  }

  /**
  /**
   * 8️⃣ Verificar token JWT
   */
  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return { valid: true, payload };
    } catch (error) {
      this.logger.error('Error verificando token:', error);
      return { valid: false, error: error.message };
    }
  }
}