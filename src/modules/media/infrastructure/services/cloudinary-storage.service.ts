import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { ObjectStoragePort, ObjectStorageUploadResult } from '@/modules/media/application/ports/object-storage.port';
import { v2 as cloudinary } from 'cloudinary';
import path from 'node:path';
import { Readable, type Writable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

type CloudinaryResourceType = 'image' | 'video' | 'raw';

const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.heic', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.avi', '.m4v', '.mkv', '.mov', '.mp4', '.mpeg', '.mpg', '.webm']);

export class CloudinaryStorageService implements ObjectStoragePort {
  private readonly log: LoggerPort;

  constructor(
    private readonly logger: LoggerPort,
    private readonly config: CloudinaryConfig
  ) {
    this.log = this.logger.child({ module: 'cloudinary' });
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true
    });
  }

  async uploadFile({
    filename,
    filepath,
    contentType
  }: {
    filename: string;
    filepath: string;
    contentType: string;
  }): Promise<ObjectStorageUploadResult> {
    const resourceType = this.getResourceType(filename, contentType);
    const publicId = this.toPublicId(filename, resourceType);

    try {
      const result = await cloudinary.uploader.upload(filepath, {
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
        unique_filename: false
      });

      return { url: result.secure_url || result.url || '' };
    } catch (error) {
      this.log.error({ err: error, filename }, 'cloudinary-storage:::upload-failed');
      throw error;
    }
  }

  async createPresignedUrl(filename: string): Promise<string> {
    return cloudinary.uploader.upload_url({
      resource_type: this.getResourceType(filename)
    }) as unknown as string;
  }

  async streamFile(res: Writable, filepath: string): Promise<void> {
    const resourceType = this.getResourceType(filepath);
    const publicId = this.toPublicId(filepath, resourceType);
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true,
      sign_url: true
    });

    try {
      const response = await fetch(url);
      if (!response.ok || !response.body) {
        throw new Error('Cloudinary object not found');
      }

      Readable.fromWeb(response.body as ReadableStream).pipe(res);
    } catch {
      throw new Error('Cloudinary object not found');
    }
  }

  private getResourceType(filename: string, contentType?: string): CloudinaryResourceType {
    const normalizedContentType = contentType?.toLowerCase() ?? '';
    const extension = path.extname(filename).toLowerCase();

    if (normalizedContentType.startsWith('image/') || IMAGE_EXTENSIONS.has(extension)) {
      return 'image';
    }

    if (normalizedContentType.startsWith('video/') || VIDEO_EXTENSIONS.has(extension)) {
      return 'video';
    }

    return 'raw';
  }

  private toPublicId(filename: string, resourceType: CloudinaryResourceType): string {
    const normalized = filename.replace(/\\/g, '/').replace(/^\/+/, '');
    if (resourceType === 'raw') {
      return normalized;
    }

    const extension = path.extname(normalized);
    return extension ? normalized.slice(0, -extension.length) : normalized;
  }
}
