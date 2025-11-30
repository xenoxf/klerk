import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { MailService } from './mail.service';
import { GoogleStrategy } from './strategies/google.strategy';

import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule, // ⬅️ MUY IMPORTANTE: sin esto ConfigService no sirve

    forwardRef(() => UsersModule),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),   // ⬅️ AQUÍ LEE LA VAR
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),

    PassportModule.register({ session: false }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    MailService,
    GoogleStrategy,
  ],

  exports: [
    JwtModule,
    PassportModule
  ],
})
export class AuthModule {}
