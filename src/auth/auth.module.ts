import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { MailService } from './mail.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule, UsersModule],
  providers: [AuthService, JwtStrategy, GoogleStrategy, MailService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
