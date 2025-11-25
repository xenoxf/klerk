import { Controller, Post, Body, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { GoogleAuthGuard } from 'src/common/guards/google-auth/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 
   * 1️⃣ Pre-registro: se envía el email pero NO se crea usuario
   */
  @Post('pre-register')
  preRegister(@Body() dto: CreateAuthDto) {
    return this.authService.preRegister(dto);
  }

  /**
   * 2️⃣ Verificar el token del correo (GET url con token)
   */
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmailToken(token);
  }

  /**
   * 3️⃣ Registro final (solo si token es válido)
   */
  @Post('register-final')
  registerFinal(@Body('token') token: string) {
    return this.authService.registerWithVerifiedData(token);
  }

  /**
   * 4️⃣ Login normal
   */
  @Post('login')
  login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto);
  }

  // ------------------------------------------------------------
  // 🚀 GOOGLE AUTH
  // ------------------------------------------------------------

  /**
   * 5️⃣ Redirige a Google (no retorna nada)
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    return;
  }

  /**
   * 6️⃣ Callback desde Google
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req) {
    // req.user viene del validate() del GoogleStrategy
    return this.authService.loginWithGoogle(req.user);
  }
}
