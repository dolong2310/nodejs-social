import fs from 'fs';

export interface IFileStorage {
  readFile(filepath: string): Promise<Buffer>;
  exists(filepath: string): Promise<boolean>;
  stat(filepath: string): Promise<{ size: number; isDirectory: boolean }>;
  delete(filepath: string): Promise<void>;
  readdir(directoryPath: string): Promise<string[]>;
  deleteDirectory(directoryPath: string): Promise<void>;
  existsSync(filepath: string): boolean;
  createReadStream(filepath: string, options?: { start?: number; end?: number }): fs.ReadStream;
}
