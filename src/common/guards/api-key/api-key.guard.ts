import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// Endpoints públicos que no requieren API key
const PUBLIC_PATHS = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/google/callback',
  '/auth/google/url',
  '/auth/guest',
  '/health',
]);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = request.path;

    // Saltar verificación para endpoints públicos de autenticación
    if (PUBLIC_PATHS.has(path) || PUBLIC_PATHS.has(path.split('?')[0])) {
      return true;
    }

    // Saltar verificación para archivos estáticos (imágenes, CSS, JS, fuentes)
    const accept = request.headers['accept'] || '';
    const isStaticAsset = /\.(png|jpe?g|gif|svg|ico|css|js|woff2?|ttf|eot|webp|map)(\?.*)?$/.test(path);
    const isBrowserRequest = accept.includes('text/html') || isStaticAsset;

    if (isBrowserRequest && !path.startsWith('/api/')) {
      return true;
    }

    const apiKey = request.headers['x-api-key'];
    if (apiKey === process.env.API_KEY) {
      return true;
    }

    return false;
  }
}
