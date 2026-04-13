import { IFileStorage } from '@/application/ports/file-storage.port';

import fs from 'fs/promises';
import fsSync from 'fs';

export class LocalFileStorage implements IFileStorage {
  async readFile(filepath: string): Promise<Buffer> {
    return await fs.readFile(filepath);
  }

  async exists(filepath: string): Promise<boolean> {
    return await fs
      .access(filepath)
      .then(() => true)
      .catch(() => false);
  }

  async stat(filepath: string): Promise<{ size: number; isDirectory: boolean }> {
    const stat = await fs.stat(filepath);
    return { size: stat.size, isDirectory: stat.isDirectory() };
  }

  async delete(filepath: string): Promise<void> {
    await fs.unlink(filepath);
  }

  async readdir(directoryPath: string): Promise<string[]> {
    const fileList = await fs.readdir(directoryPath);
    return fileList;
  }

  async deleteDirectory(directoryPath: string): Promise<void> {
    await fs.rm(directoryPath, { recursive: true, force: true });
  }

  existsSync(filepath: string): boolean {
    return fsSync.existsSync(filepath);
  }

  createReadStream(filepath: string, options?: { start?: number; end?: number }): fsSync.ReadStream {
    return fsSync.createReadStream(filepath, options);
  }
}
