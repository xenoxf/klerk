import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// Endpoints públicos que no requieren API key
// NOTA: endpoints con su propio guard (JWT, RequireAuth) se agregan aquí
// porque ya tienen su propia protección. El API key es una capa EXTRA.
const PUBLIC_PATHS = new Set([
  // Auth endpoints - already protected by their own logic
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/google/callback',
  '/auth/google/url',
  '/auth/guest',
  '/auth/verify_token',
  '/auth/me',
  '/auth/refresh',
  // All auth sub-paths
  '/auth/logout',
  // Public endpoints
  '/hello',
  '/health',
  '/ping',
  '/credits/costs',
]);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const path = request.path;
    const cleanPath = path.split('?')[0];

    // Skip public paths
    if (PUBLIC_PATHS.has(cleanPath)) {
      return true;
    }

    // Skip static assets
    const accept = request.headers['accept'] || '';
    const isStaticAsset =
      /\.(png|jpe?g|gif|svg|ico|css|js|woff2?|ttf|eot|webp|map)(\?.*)?$/.test(
        cleanPath,
      );
    const isBrowserRequest = accept.includes('text/html') || isStaticAsset;

    if (isBrowserRequest && !cleanPath.startsWith('/api/')) {
      return true;
    }

    // Check API key
    const apiKey = request.headers['x-api-key'];
    if (apiKey === process.env.API_KEY) {
      return true;
    }

    // If no API key configured on server, allow all (dev mode fallback)
    if (!process.env.API_KEY) {
      return true;
    }

    return false;
  }
}
