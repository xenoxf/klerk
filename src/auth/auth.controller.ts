import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/pre-register
   * Inicia proceso de registro y envía correo
   */
  @Post('pre-register')
  async preRegister(@Body() createAuthDto: CreateAuthDto) {
    try {
      console.log('📨 POST /auth/pre-register');
      const result = await this.authService.preRegister(createAuthDto);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * GET /auth/verify-email/:token
   */
  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    try {
      const result = await this.authService.verifyEmailToken(token);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * POST /auth/register-final/:token
   */
  @Post('register-final/:token')
  async registerFinal(@Param('token') token: string) {
    try {
      const result = await this.authService.registerWithVerifiedData(token);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * POST /auth/login
   */
  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto) {
    try {
      const result = await this.authService.login(loginAuthDto);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * POST /auth/register
   */
  @Post('register')
  async register(@Body() dto: CreateAuthDto) {
    try {
      const response = await this.authService.register(dto);
      return { success: true, data: response };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  /**
   * GET /auth/google/url
   * Devuelve la URL generada manualmente
   */
  @Get('google/url')
  async getGoogleUrl() {
    try {
      const data = await this.authService.getGoogleAuthUrl();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /* ============================================================
     GOOGLE OAUTH REAL (ESTO ES LO QUE TE FALTABA)
     ============================================================ */

  /**
   * GET /auth/google
   * Inicia autenticación con Google (usa GoogleStrategy)
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Este método no ejecuta nada.
    // Passport redirige automáticamente a Google.
  }

  /**
   * GET /auth/google/callback
   * Google redirige aquí después del login
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    try {
      console.log('✓ GET /auth/google/callback');

      const { token } = await this.authService.loginWithGoogle(req.user);

      const FRONTEND = process.env.FRONTEND_URL;

      const redirectUrl = `${FRONTEND}/auth?token=${token}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Error en Google callback:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth?error=google_auth_failed`,
      );
    }
  }

  /**
   * GET /auth/verify-token/:token
   */
  @Get('verify-token/:token')
  async verifyToken(@Param('token') token: string) {
    const result = this.authService.verifyToken(token);
    return { success: result.valid, data: result };
  }
}
