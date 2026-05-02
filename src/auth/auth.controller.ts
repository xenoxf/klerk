import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { AuthenticatedRequest } from '../common/types/request.type';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() createAuthDto: CreateAuthDto) {
    try {
      return await this.authService.register(createAuthDto);
    } catch (error) {
      this.logger.error('Register error:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error al registrarse',
      );
    }
  }

  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto) {
    try {
      return await this.authService.login(loginAuthDto);
    } catch (error) {
      this.logger.error('Login error:', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Credenciales inválidas',
      );
    }
  }

  @Get('google/url')
  async getGoogleAuthUrl() {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/callback';

      if (!clientId) {
        throw new Error('GOOGLE_CLIENT_ID no está configurado');
      }

      const scope = 'profile email';
      const responseType = 'code';
      const accessType = 'offline';

      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.append('client_id', clientId);
      url.searchParams.append('redirect_uri', redirectUri);
      url.searchParams.append('response_type', responseType);
      url.searchParams.append('scope', scope);
      url.searchParams.append('access_type', accessType);
      url.searchParams.append('prompt', 'consent');

      return { url: url.toString() };
    } catch (error) {
      this.logger.error('Get Google Auth URL error:', error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Error al obtener URL de Google Auth',
      );
    }
  }

  @Get('google/callback')
  async googleCallbackGet(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    try {
      const code = (req as any).query.code;

      if (!code) {
        this.logger.warn('Google callback without code');
        const redirectUrl = new URL(
          process.env.FRONTEND_CALLBACK_URL || 'http://localhost:3000/auth',
        );
        redirectUrl.searchParams.append('error', 'no_code');
        return res.redirect(redirectUrl.toString());
      }

      const result = await this.authService.googleAuthWithCode(code as string);

      // Redirigir al frontend con el token en URL
      const redirectUrl = new URL(
        process.env.FRONTEND_CALLBACK_URL ||
        'http://localhost:3000/auth/callback',
      );
      redirectUrl.searchParams.append('token', result.token);
      redirectUrl.searchParams.append('email', result.user.email);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      this.logger.error('Google callback GET error:', error);
      const redirectUrl = new URL(
        process.env.FRONTEND_CALLBACK_URL || 'http://localhost:3000/auth',
      );
      redirectUrl.searchParams.append('error', 'google_failed');
      return res.redirect(redirectUrl.toString());
    }
  }

  @Post('google/callback')
  async googleCallbackPost(@Body() body: { code?: string }) {
    try {
      const code = body?.code?.trim();
      if (!code) {
        throw new BadRequestException('Código de autorización requerido');
      }

      const result = await this.authService.googleAuthWithCode(code);
      return result;
    } catch (error) {
      this.logger.error('Google callback POST error:', error);
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al procesar Google Auth',
      );
    }
  }

  @Post('google')
  async googleAuth(@Body('idToken') idToken: string) {
    try {
      if (!idToken) {
        throw new BadRequestException('ID token requerido');
      }

      const result = await this.authService.googleAuthWithToken(idToken);
      return result;
    } catch (error) {
      this.logger.error('Google auth error:', error);
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al autenticar con Google',
      );
    }
  }

  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest) {
    try {
      const userId = req.user.id || req.user.sub;
      if (!userId) {
        // Si no hay usuario autenticado, solo retornar éxito
        return { message: 'Sesión cerrada correctamente' };
      }
      return await this.authService.logout(userId);
    } catch (error) {
      this.logger.error('Logout error:', error);
      return { message: 'Sesión cerrada correctamente' };
    }
  }

  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    try {
      if (!body?.refreshToken?.trim()) {
        throw new UnauthorizedException('Refresh token requerido');
      }
      return { message: 'Sesión cerrada correctamente' };
    } catch (error) {
      this.logger.error('Refresh token error:', error);
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Error al refrescar sesión',
      );
    }
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('verify_token')
  @UseGuards(AuthGuard('jwt'))
  verifyToken(@Req() req: AuthenticatedRequest) {
    return {
      valid: true,
      user: req.user,
      message: 'Token is valid',
    };
  }

  @Post('guest')
  async guestLogin() {
    try {
      return await this.authService.loginAsGuest();
    } catch (error) {
      this.logger.error('Guest login error:', error);
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Error al iniciar como invitado',
      );
    }
  }

  @Get('junior')
  async junior() {
    return 'Junior';
  }
}
