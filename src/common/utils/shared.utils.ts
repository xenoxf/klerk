/**
 * Shared utility functions used across the application.
 * Extracted from duplicated implementations in controllers and services.
 */
import { ForbiddenException } from '@nestjs/common';

/**
 * Extract numeric user ID from request object.
 * Throws ForbiddenException if user ID is not a valid number or if it's a guest.
 */
export function getNumericUserId(req: {
  user?: { id?: unknown; isGuest?: boolean };
}): number {
  if (req.user?.isGuest) {
    throw new ForbiddenException(
      'Los usuarios invitados no pueden realizar esta acción. Inicia sesión para continuar.',
    );
  }

  const rawId = req.user?.id;

  // Handle guest_ style IDs even if isGuest flag is missing
  if (typeof rawId === 'string' && rawId.startsWith('guest_')) {
    throw new ForbiddenException(
      'Los usuarios invitados no pueden realizar esta acción. Inicia sesión para continuar.',
    );
  }

  const userId = Number(rawId);
  if (isNaN(userId)) {
    throw new ForbiddenException('Acceso no permitido');
  }
  return userId;
}

/**
 * Extract numeric user ID from request object if available.
 * Returns null for guests or invalid IDs instead of throwing.
 */
export function getOptionalNumericUserId(req: {
  user?: { id?: unknown; isGuest?: boolean };
}): number | null {
  if (!req.user || req.user.isGuest) {
    return null;
  }

  const rawId = req.user.id;

  // Handle guest_ style IDs even if isGuest flag is missing
  if (typeof rawId === 'string' && rawId.startsWith('guest_')) {
    return null;
  }

  const userId = Number(rawId);
  if (isNaN(userId)) {
    return null;
  }
  return userId;
}

/**
 * Fisher-Yates shuffle algorithm.
 * Returns a new shuffled array without mutating the original.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Normalizes access string to 'publico' or 'privado'.
 * Handles both 'public' and 'publico' variants.
 */
export function normalizeAccess(acceso?: string): string {
  if (!acceso) return 'privado';
  const normalized = acceso.toLowerCase().trim();
  if (normalized === 'public' || normalized === 'publico') return 'publico';
  return 'privado';
}

/**
 * Checks if the given access string represents public visibility.
 */
export function isPublicAccess(acceso?: string | null): boolean {
  const normalized = (acceso ?? '').toLowerCase();
  return normalized === 'public' || normalized === 'publico';
}
