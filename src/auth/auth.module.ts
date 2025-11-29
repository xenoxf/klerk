import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';
import { UsersModule } from '../users/users.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    PassportModule.register({session:false})
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService, JwtService,GoogleStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
