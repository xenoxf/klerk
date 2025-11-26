import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 🚀 PERMITIR PRE-FLIGHT AUTOMÁTICAMENTE
    if (request.method === 'OPTIONS') return true;

    const apiKey = request.headers['x-api-key'];
    if (apiKey === process.env.X_API_KEY) {
      return true;
    }

    return false;
  }
}
