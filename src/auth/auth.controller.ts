import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Res,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Validate } from 'class-validator';

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
        'http://localhost:2300/auth/google/callback';

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
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Request() req: any, @Res() res: Response) {
    try {
      const result = await this.authService.googleAuth(req.user);

      // Redirigir al frontend con el token en URL
      const redirectUrl = new URL(
        process.env.FRONTEND_CALLBACK_URL ||
        'http://localhost:3000/auth/callback',
      );
      redirectUrl.searchParams.append('token', result.token);
      redirectUrl.searchParams.append('email', result.user.email);

      return res.redirect(redirectUrl.toString());
    } catch (error) {
      this.logger.error('Google callback error:', error);
      const redirectUrl = new URL(
        process.env.FRONTEND_CALLBACK_URL || 'http://localhost:3000/auth',
      );
      redirectUrl.searchParams.append('error', 'google_failed');
      return res.redirect(redirectUrl.toString());
    }
  }

  @Post('google/callback')
  async googleCallbackPost(
    @Query('code') code: string,
    //@Body('state') state?: string,
  ) {
    try {
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
  logout() {
    return { message: 'Sesión cerrada correctamente' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Request() req: any) {
    return req.user;
  }

  @Get('verify_token')
  @UseGuards(AuthGuard('jwt'))
  verifyToken(@Request() req: any) {
    return {
      valid: true,
      user: req.user,
      message: 'Token is valid',
    };
  }
}

