export const ACCEPTED_MIME_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Magic bytes para validación real de tipo de archivo
export const MAGIC_BYTES: Record<string, { signature: number[]; offset: number }[]> = {
  'image/png': [{ signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 }],
  'image/jpeg': [
    { signature: [0xFF, 0xD8, 0xFF, 0xE0], offset: 0 },
    { signature: [0xFF, 0xD8, 0xFF, 0xE1], offset: 0 },
    { signature: [0xFF, 0xD8, 0xFF, 0xE2], offset: 0 },
  ],
  'image/webp': [{ signature: [0x52, 0x49, 0x46, 0x46], offset: 0 }], // "RIFF" + 8 bytes + "WEBP"
  'image/gif': [
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], offset: 0 }, // "GIF87a"
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], offset: 0 }, // "GIF89a"
  ],
  'application/pdf': [{ signature: [0x25, 0x50, 0x44, 0x46], offset: 0 }], // "%PDF"
};

export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  return signatures.some(({ signature, offset }) => {
    if (buffer.length < offset + signature.length) return false;
    for (let i = 0; i < signature.length; i++) {
      if (buffer[offset + i] !== signature[i]) return false;
    }
    return true;
  });
}

export function validateWebpMagicBytes(buffer: Buffer): boolean {
  // Verificar "RIFF" + tamaño + "WEBP"
  if (buffer.length < 12) return false;
  if (buffer[0] !== 0x52 || buffer[1] !== 0x49 || buffer[2] !== 0x46 || buffer[3] !== 0x46) return false;
  if (buffer[8] !== 0x57 || buffer[9] !== 0x45 || buffer[10] !== 0x42 || buffer[11] !== 0x50) return false;
  return true;
}
