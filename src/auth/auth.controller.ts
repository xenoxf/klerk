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
  constructor(private readonly authService: AuthService) {}

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

  /* ================= GOOGLE ================= */

  // 🔗 Genera la URL correctamente
  @Get('google/url')
  async getGoogleUrl() {
    return this.authService.getGoogleAuthUrl();
  }

  // 🚀 Redirige a Google
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  // 🔥 Recibe datos Google → redirige al frontend con token
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    try {
      const { token } = await this.authService.loginWithGoogle(req.user);

      return res.redirect(
        `${process.env.FRONTEND_URL}/auth?token=${token}`
      );
    } catch (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth?error=google_failed`
      );
    }
  }
  @Post("google/onetap")
async googleOneTap(@Body("idToken") idToken: string) {
  return this.authService.loginWithGoogle4(idToken);
}


  // Verificar token
  @Get('verify-token/:token')
  async verifyToken(@Param('token') token: string) {
    return this.authService.verifyToken(token);
  }
}
