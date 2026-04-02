import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_AUTH_KEY } from '../../decorators/require-auth.decorator';

@Injectable()
export class RequireAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireAuth = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireAuth) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Acceso requiere autenticación');
    }

    if (user.isGuest) {
      throw new ForbiddenException(
        'Los usuarios invitados no pueden realizar esta acción. Inicia sesión para continuar.',
      );
    }

    return true;
  }
}
