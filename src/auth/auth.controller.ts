import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ============= REGISTRO NORMAL ============= */
  @Post('pre-register')
  async preRegister(@Body() dto: CreateAuthDto) {
    return this.authService.preRegister(dto);
  }

  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    return this.authService.verifyEmailToken(token);
  }

  @Post('register-final/:token')
  async registerFinal(@Param('token') token: string) {
    return this.authService.registerWithVerifiedData(token);
  }

  @Post('login')
  async login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  async register(@Body() dto: CreateAuthDto) {
    return this.authService.register(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Este método se ejecuta automáticamente
    // Redirige a Google para login
  }

  // 2. Callback de Google (IMPORTANTE: debe ser GET)
  @Get('google/callback')  // ✅ GET, no POST
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    try {
      const { token } = await this.authService.loginWithGoogle(req.user);
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
      );
    } catch (err) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?error=google_failed`
      );
    }
  }

}