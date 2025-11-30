import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * POST /auth/pre-register
   * Inicia proceso de registro y envía correo
   */
  @Post('pre-register')
  async preRegister(@Body() createAuthDto: CreateAuthDto) {
      console.log('📨 POST /auth/pre-register');
      return await this.authService.preRegister(createAuthDto);
  }

  /**
   * GET /auth/verify-email/:token
   */
  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
      return await this.authService.verifyEmailToken(token);
  }

  /**
   * POST /auth/register-final/:token
   */
  @Post('register-final/:token')
  async registerFinal(@Param('token') token: string) {
      return await this.authService.registerWithVerifiedData(token);
  }

  /**
   * POST /auth/login
   */
  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto) {
    return await this.authService.login(loginAuthDto);
  }

  /**
   * POST /auth/register
   */
  @Post('register')
  async register(@Body() dto: CreateAuthDto) {
      return  this.authService.register(dto);
  }

  /**
   * GET /auth/google/url
   * Devuelve la URL generada manualmente
   */
  @Get('google/url')
  async getGoogleUrl() {
      return  this.authService.getGoogleAuthUrl();
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
    return this.authService.verifyToken(token);
  }
}
