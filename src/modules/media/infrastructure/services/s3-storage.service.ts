import { envConfig } from '@/bootstrap/config/env.config';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { ObjectStoragePort, ObjectStorageUploadResult } from '@/modules/media/application/ports/object-storage.port';
import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Writable } from 'node:stream';

export class S3Service implements ObjectStoragePort {
  private readonly s3: S3;
  private readonly log: LoggerPort;

  constructor(
    private readonly logger: LoggerPort,
    private readonly fileStorage: FileStoragePort
  ) {
    this.log = this.logger.child({ module: 's3' });
    this.s3 = new S3({
      region: envConfig.AWS_REGION,
      credentials: {
        accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
        secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY
      }
    });

    // this.s3.listBuckets({}).then(data => {
    //   console.log("data: ", data);
    // });
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
    try {
      const { size } = await this.fileStorage.stat(filepath);

      const parallelUploads3 = new Upload({
        client: this.s3,

        params: {
          Bucket: envConfig.AWS_S3_BUCKET_NAME,
          Key: filename,
          // Body: readFileSync(filepath),
          Body: this.fileStorage.createReadStream(filepath), // dùng createReadStream thay vì readFileSync để tránh block event-loop và giảm RAM khi upload file lớn.
          ContentType: contentType,
          ContentLength: size // giúp multipart upload hoạt động ổn định với stream
        },
        // (optional) tags
        tags: [],
        // (optional) concurrency configuration
        queueSize: 4,
        // (optional) size of each part, in bytes, at least 5MB
        partSize: 1024 * 1024 * 5,
        // (optional) when true, do not automatically call AbortMultipartUpload when a multipart upload fails to complete. You should then manually handle the leftover parts.
        leavePartsOnError: false
      });

      // parallelUploads3.on("httpUploadProgress", (progress) => {
      //   console.log(progress);
      // });

      const result = await parallelUploads3.done();

      return { url: result.Location ?? '' };
    } catch (error) {
      this.log.error({ err: error, filename }, 's3-service:::upload-to-s3-failed');
      throw error;
    }
  }

  async createPresignedUrl(filename: string): Promise<string> {
    const contentType = this.fileStorage.getContentType(filename, 'application/octet-stream');
    const command = new PutObjectCommand({
      Bucket: envConfig.AWS_S3_BUCKET_NAME,
      Key: filename,
      ContentType: contentType
    });
    return getSignedUrl(this.s3, command, { expiresIn: 10 }); // 10 seconds
  }

  async streamFile(res: Writable, filepath: string): Promise<void> {
    try {
      const s3Object = await this.s3.getObject({
        Bucket: envConfig.AWS_S3_BUCKET_NAME,
        Key: filepath
      });

      if (!s3Object.Body) {
        throw new Error('S3 object not found');
      }

      (s3Object.Body as NodeJS.ReadableStream).pipe(res);
    } catch {
      throw new Error('S3 object not found');
    }
  }
}

// Test upload file to S3
// const s3Instance = new S3Service();
// s3Instance
//   .uploadFile({
//     filename: 'images/test.png',
//     filepath: '/Users/dolong/Documents/NestJS/ecommerce/upload/201e4d10-8cea-4c57-a5bd-9883dbc50d23.png',
//     contentType: 'image/png',
//   })
//   .then(console.log)
//   .catch(console.error);
