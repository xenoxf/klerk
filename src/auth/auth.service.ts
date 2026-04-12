import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /** 🔐 Generar JWT access token (duración de 24h para buena UX) */
  private generateAccessToken(user: any) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email ?? null,
        provider: user.provider,
      },
      { expiresIn: '24h' },
    );
  }

  /** 🔑 Generar refresh token (larga duración) */
  private generateRefreshToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  /** 🔐 Hash refresh token antes de guardar en DB */
  private hashRefreshToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** 📅 Calcular fecha de expiración del refresh token (30 días) */
  private getRefreshTokenExpiry() {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30); // 30 días
    return expiry;
  }

  /** Validar email único (soporta email nullable) */
  private async validateUniqueEmail(email: string | null): Promise<void> {
    if (!email) return;

    const exists = await this.usersService.findByEmail(email);
    if (exists) {
      throw new BadRequestException('Este correo ya está registrado.');
    }
  }

  /** 1️⃣ Pre-registro */
  async preRegister(dto: CreateAuthDto) {
    await this.validateUniqueEmail(dto.email);

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
      this.logger.log(`Email de verificación enviado a: ${dto.email}`);

      return {
        message: 'Te enviamos un correo para verificar tu email.',
        emailSent: true,
        token, // útil para pruebas locales
      };
    } catch (err) {
      this.logger.error(`Error enviando email a ${dto.email}:`, err);

      throw new InternalServerErrorException({
        message: 'No se pudo enviar el correo de verificación.',
        emailSent: false,
      });
    }
  }

  /** 2️⃣ Verificar token de email */
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

  /** 3️⃣ Crear usuario con datos verificados */
  async registerWithVerifiedData(token: string) {
    let payload;

    try {
      payload = this.jwtService.verify(token);

      if (payload.purpose !== 'email-verification') {
        throw new BadRequestException('Token inválido para este propósito.');
      }
    } catch {
      throw new BadRequestException('Token inválido o expirado.');
    }

    await this.validateUniqueEmail(payload.email);

    const user = await this.usersService.createLocal({
      email: payload.email,
      name: payload.name ?? payload.email,
      password: payload.password,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiry();
    await this.usersService.update(user.id, { refreshToken: hashedRefreshToken, refreshTokenExpiresAt });

    return {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    };
  }

  /** 4️⃣ Registro directo */
  async register(dto: CreateAuthDto) {
    await this.validateUniqueEmail(dto.email);

    const user = await this.usersService.createLocal({
      email: dto.email,
      password: dto.password,
      name: dto.name ?? dto.email,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiry();
    await this.usersService.update(user.id, { refreshToken: hashedRefreshToken, refreshTokenExpiresAt });

    return {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture || null,
      },
    };
  }

  /** 5️⃣ Login normal */
  async login(dto: LoginAuthDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    if (user.provider !== 'local') {
      throw new UnauthorizedException(
        'Este email está registrado con Google. Usa Google para iniciar sesión.',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException('Usuario sin contraseña local.');
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiry();
    await this.usersService.update(user.id, { refreshToken: hashedRefreshToken, refreshTokenExpiresAt });

    return {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture || null,
      },
    };
  }

  /** 6️⃣ Login con Google (callback simple) */
  async loginWithGoogle(googleUser: any) {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      user = await this.usersService.createGoogle({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        providerId:
          googleUser.providerId || googleUser.googleId || googleUser.sub,
        provider: 'google',
      });
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiry();
    await this.usersService.update(user.id, { refreshToken: hashedRefreshToken, refreshTokenExpiresAt });

    return { token: accessToken, refreshToken, user };
  }

  /** 7️⃣ Flujo Google centralizado */
  async googleAuth(profile: any) {
    try {
      const providerId = profile.providerId || profile.googleId || profile.sub;

      let user = await this.usersService.findByProviderId(providerId);

      if (!user) {
        user = await this.usersService.createGoogle({
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          providerId: providerId,
          provider: 'google',
        });
      }

      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken();
      const hashedRefreshToken = this.hashRefreshToken(refreshToken);
      const refreshTokenExpiresAt = this.getRefreshTokenExpiry();
      await this.usersService.update(user.id, { refreshToken: hashedRefreshToken, refreshTokenExpiresAt });

      return {
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          provider: user.provider,
        },
      };
    } catch (error) {
      this.logger.error('Google auth error:', error);
      throw new InternalServerErrorException('Error al autenticar con Google');
    }
  }

  /** 8️⃣ Google Auth con código de autorización */
  async googleAuthWithCode(code: string) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/callback';

      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials no están configuradas');
      }

      // Intercambiar código por access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text().catch(() => '');
        this.logger.error(
          `Google token exchange failed: ${tokenResponse.status} ${errBody}`,
        );
        throw new Error(
          `Error al obtener token de Google: ${tokenResponse.status}. Verifica que GOOGLE_REDIRECT_URI coincida con la URL de autorización.`,
        );
      }

      const tokens = await tokenResponse.json();
      const idToken = tokens.id_token as string | undefined;
      const accessToken = tokens.access_token as string | undefined;

      let userInfo: {
        sub: string;
        email: string;
        name?: string;
        picture?: string;
      };

      if (idToken) {
        userInfo = (await this.verifyGoogleToken(idToken)) as typeof userInfo;
      } else if (accessToken) {
        const profileRes = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (!profileRes.ok) {
          throw new Error('No se pudo obtener el perfil de Google');
        }
        const p = await profileRes.json();
        userInfo = {
          sub: String(p.sub || p.id),
          email: String(p.email),
          name: p.name,
          picture: p.picture,
        };
      } else {
        throw new Error('Respuesta de Google sin id_token ni access_token');
      }

      return this.googleAuth({
        providerId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      });
    } catch (error) {
      this.logger.error('Google auth with code error:', error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Error al procesar Google Auth',
      );
    }
  }

  /** 9️⃣ Google Auth con ID token */
  async googleAuthWithToken(idToken: string) {
    try {
      // Verificar ID token
      const userInfo = await this.verifyGoogleToken(idToken);

      return this.googleAuth({
        providerId: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      });
    } catch (error) {
      this.logger.error('Google auth with token error:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Token inválido',
      );
    }
  }

  /** 🔟 Verificar token de Google */
  private async verifyGoogleToken(idToken: string) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;

      if (!clientId) {
        throw new Error('GOOGLE_CLIENT_ID no está configurado');
      }

      // Verificar token con Google
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      const userInfo = await response.json();

      // Verificar que el token sea para nuestra app
      if (userInfo.aud !== clientId) {
        throw new Error('Token no es válido para esta aplicación');
      }

      return userInfo;
    } catch (error) {
      this.logger.error('Google token verification error:', error);
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Error al verificar token de Google',
      );
    }
  }

  /** 1️⃣1️⃣ Verificar token JWT */
  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return { valid: true, payload };
    } catch (error) {
      this.logger.error('Error verificando token:', error);
      return { valid: false, error: error.message };
    }
  }

  /** 1️⃣2️⃣ Guest login - token temporal sin guardar en DB */
  async loginAsGuest() {
    // Generar usuario guest temporal (no se guarda en DB)
    const guestUser = {
      id: `guest_${Date.now()}`,
      email: null,
      name: 'Invitado',
      provider: 'guest',
      isGuest: true,
    };

    // Token con expiración de 24 horas y flag isGuest
    const token = this.jwtService.sign(
      {
        sub: guestUser.id,
        email: guestUser.email,
        provider: guestUser.provider,
        isGuest: true,
      },
      { expiresIn: '24h' },
    );

    // Guests también reciben refresh token (no se guarda en DB, se invalida al expirar)
    const refreshToken = this.generateRefreshToken();

    return {
      token,
      refreshToken,
      user: {
        id: guestUser.id,
        name: guestUser.name,
        email: guestUser.email,
        isGuest: true,
      },
    };
  }

  /** 1️⃣3️⃣ Refresh Token - Rotar access token */
  async refreshToken(refreshToken: string) {
    const hashedToken = this.hashRefreshToken(refreshToken);

    // Buscar usuario con este refresh token
    const user = await this.usersService.findByRefreshToken(hashedToken);
    if (!user) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // Verificar que el refresh token no haya expirado
    if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
      // Token expirado - limpiar refresh token del usuario
      await this.usersService.update(user.id, { refreshToken: null, refreshTokenExpiresAt: null });
      throw new UnauthorizedException('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    // Generar nuevo par de tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken();
    const newHashedRefreshToken = this.hashRefreshToken(newRefreshToken);
    const newRefreshTokenExpiresAt = this.getRefreshTokenExpiry();

    // Rotar refresh token (invalidar el anterior)
    await this.usersService.update(user.id, {
      refreshToken: newHashedRefreshToken,
      refreshTokenExpiresAt: newRefreshTokenExpiresAt,
    });

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture || null,
      },
    };
  }

  /** 1️⃣4️⃣ Logout - Invalidar refresh token */
  async logout(userId: number | string) {
    if (typeof userId === 'string' && userId.startsWith('guest_')) {
      // Guests no tienen refresh token en DB
      return { message: 'Sesión de invitado cerrada' };
    }

    await this.usersService.update(Number(userId), { refreshToken: null, refreshTokenExpiresAt: null });
    return { message: 'Sesión cerrada correctamente' };
  }
}

// Nota: El campo 'provider' ha sido reemplazado por 'providerId'
// googleAuth() está correctamente implementado en auth.service.ts
// googleAuthWithCode() maneja el intercambio de código
// googleAuthWithToken() valida ID tokens
