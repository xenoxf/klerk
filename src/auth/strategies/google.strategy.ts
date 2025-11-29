import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL.replace(/\/$/, '')}/auth/google/callback`,
      scope: ['openid', 'email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const userData = {
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
      provider: 'google',
      providerId: profile.id,
      emailVerified: true,
    };

    // Crea o obtiene al usuario
    const user = await this.usersService.createGoogle(userData);

    // Lo que Passport enviará a req.user
    return {
      ...user,
      accessToken,
    };
  }
}
