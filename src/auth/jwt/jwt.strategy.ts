import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required and must be set to a strong secret');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    try {
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      // Aquí puedes buscar el usuario en la BD si necesitas
      // const user = await this.usersService.findOne(payload.sub);
      // if (!user) throw new UnauthorizedException('User not found');

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };
    } catch (error) {
      this.logger.error('JWT validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
