import { envConfig } from '@/config';
import { Injectable } from '@/decorators';
import { LoggerInstance } from '@/providers/logger';
import { NotFoundError } from '@/providers/responses';
import { CompleteMultipartUploadCommandOutput, GetObjectCommandOutput, PutObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Response } from 'express';
import { readFileSync } from 'fs';
import mime from 'mime-types';

const log = LoggerInstance.getLogger().child({ module: 's3' });

export interface IS3Service {
  uploadFile(payload: {
    filename: string;
    filepath: string;
    contentType: string;
  }): Promise<CompleteMultipartUploadCommandOutput>;
  createPresignedUrlWithClient(filename: string): Promise<string>;
  sendFileFromS3(res: Response, filepath: string): Promise<GetObjectCommandOutput>;
}

@Injectable()
export class S3Service implements IS3Service {
  private readonly s3: S3;

  constructor() {
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
  }): Promise<CompleteMultipartUploadCommandOutput> {
    try {
      const parallelUploads3 = new Upload({
        client: this.s3,

        params: {
          Bucket: envConfig.AWS_S3_BUCKET_NAME,
          Key: filename,
          Body: readFileSync(filepath),
          ContentType: contentType // nếu không có contentType thì sẽ tự động download file khi upload
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

      return await parallelUploads3.done();
    } catch (error) {
      log.error({ err: error, filename }, 'upload to s3 failed');
      throw error;
    }
  }

  createPresignedUrlWithClient(filename: string): Promise<string> {
    const contentType = mime.lookup(filename) || 'application/octet-stream';
    const command = new PutObjectCommand({
      Bucket: envConfig.AWS_S3_BUCKET_NAME,
      Key: filename,
      ContentType: contentType
    });
    return getSignedUrl(this.s3, command, { expiresIn: 10 }); // 10 seconds
  }

  async sendFileFromS3(res: Response, filepath: string): Promise<GetObjectCommandOutput> {
    try {
      const s3Object = await this.s3.getObject({
        Bucket: envConfig.AWS_S3_BUCKET_NAME,
        Key: filepath
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s3Object.Body as any).pipe(res);

      return s3Object;
    } catch {
      throw new NotFoundError();
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
