/**
 * Shared utility functions used across the application.
 * Extracted from duplicated implementations in controllers and services.
 */
import { ForbiddenException } from '@nestjs/common';

/**
 * Extract numeric user ID from request object.
 * Throws ForbiddenException if user ID is not a valid number.
 */
export function getNumericUserId(req: { user?: { id?: unknown } }): number {
  const userId = Number(req.user?.id);
  if (isNaN(userId)) {
    throw new ForbiddenException('Acceso no permitido');
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
