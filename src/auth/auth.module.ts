import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { MailService } from './mail.service';
import { SharedModule } from '../shared/shared.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    SharedModule,
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiration = configService.get<string>('JWT_EXPIRATION') || '24h';

        if (!secret) {
          throw new Error('JWT_SECRET must be set in environment variables');
        }

        return {
          global: true,
          secret,
          signOptions: { expiresIn: expiration as any },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, MailService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }
