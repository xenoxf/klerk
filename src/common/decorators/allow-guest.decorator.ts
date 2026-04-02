import { SetMetadata } from '@nestjs/common';

export const ALLOW_GUEST_KEY = 'allowGuest';

/**
 * Decorator para permitir acceso a usuarios invitados (guest)
 * Se usa en endpoints de solo lectura que no requieren autenticación completa
 */
export const AllowGuest = () => SetMetadata(ALLOW_GUEST_KEY, true);
