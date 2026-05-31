import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { writeFile, unlink, access } from 'fs/promises';
import { join } from 'path';

const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);

  async saveFile(buffer: Buffer, originalName: string): Promise<string> {
    const ext = originalName.split('.').pop() || 'bin';
    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(UPLOADS_DIR, filename);
    await writeFile(filepath, buffer);
    this.logger.log(`File saved: ${filename}`);
    return filename;
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filepath = join(UPLOADS_DIR, filename);
      await access(filepath);
      await unlink(filepath);
      this.logger.log(`File deleted: ${filename}`);
    } catch {
      // File doesn't exist, ignore
    }
  }
}
