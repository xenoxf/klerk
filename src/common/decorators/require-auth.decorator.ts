import { SetMetadata } from '@nestjs/common';

export const REQUIRE_AUTH_KEY = 'requireAuth';

/**
 * Decorator para requerir autenticación completa (NO permitir invitados)
 * Se usa en endpoints que permiten crear, editar o eliminar datos
 */
export const RequireAuth = () => SetMetadata(REQUIRE_AUTH_KEY, true);
