import { Writable } from 'node:stream';

export interface ObjectStorageUploadResult {
  url: string;
}

export interface ObjectStoragePort {
  uploadFile(payload: { filename: string; filepath: string; contentType: string }): Promise<ObjectStorageUploadResult>;
  createPresignedUrl(filename: string): Promise<string>;
  streamFile(res: Writable, filepath: string): Promise<void>;
}
