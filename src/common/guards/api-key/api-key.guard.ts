import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

const PUBLIC_PATHS = new Set(['/hello', '/health', '/ping']);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = request.path;

    // ✅ Permitir rutas públicas o de autenticación
    if (PUBLIC_PATHS.has(path) || path.startsWith('/auth/')) {
      return true;
    }

    // ✅ Si ya hay usuario autenticado (JWT), NO joder
    if (request.user) {
      return true;
    }

    const apiKey: string = request.headers['x-api-key'];

    // ✅ Si no hay API key configurada → modo dev
    if (!process.env.API_KEY) {
      return true;
    }

    // ❌ Si la API key es inválida → error explícito
    if (apiKey != String(process.env.API_KEY)) {
      throw new ForbiddenException('API Key inválida o faltante. escribiste');
    }

    return true;
  }
}
