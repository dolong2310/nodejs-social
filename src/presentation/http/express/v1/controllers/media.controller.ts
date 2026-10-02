import type { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import type { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import type { GetStaticVideoStreamPort } from '@/modules/media/application/use-cases/get-static-video-stream/get-static-video-stream.port';
import type {
  GetVideoStatusPort,
  GetVideoStatusOutputPort
} from '@/modules/media/application/use-cases/get-video-status/get-video-status.port';
import type {
  UploadImagePort,
  UploadImageOutputPort
} from '@/modules/media/application/use-cases/upload-image/upload-image.port';
import type {
  UploadVideoStreamPort,
  UploadVideoStreamOutputPort
} from '@/modules/media/application/use-cases/upload-video-stream/upload-video-stream.port';
import type {
  UploadVideoPort,
  UploadVideoOutputPort
} from '@/modules/media/application/use-cases/upload-video/upload-video.port';
import { UPLOAD_DIR_IMAGE, UPLOAD_DIR_VIDEO } from '@/presentation/http/express/constants/file.constants';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import {
  StaticMediaNotFoundException,
  StaticVideoStreamInternalServerErrorException,
  VideoNotFoundException
} from '@/presentation/http/express/exceptions/media.exception';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constants';
import type { ExpressRequest, ExpressResponse, ValidatedRequest } from '@/presentation/http/express/types';
import { parseUploadedFiles } from '@/presentation/http/express/utils/parse-uploaded-files.util';
import type {
  FilenameParamsSchema,
  VideoStreamIdParamsSchema,
  VideoStreamSegmentParamsSchema
} from '@/presentation/http/express/v1/schemas/media/media.request.schema';
import type { NextFunction } from 'express';
import path from 'path';

type FilenameRequest = ValidatedRequest<{ params: typeof FilenameParamsSchema }>;
type VideoStreamIdRequest = ValidatedRequest<{ params: typeof VideoStreamIdParamsSchema }>;
type VideoStreamSegmentRequest = ValidatedRequest<{ params: typeof VideoStreamSegmentParamsSchema }>;

export interface IMediaController {
  getStaticImage(req: FilenameRequest, res: ExpressResponse, next: NextFunction): void;
  getStaticVideo(req: FilenameRequest, res: ExpressResponse, next: NextFunction): void;
  getStaticVideoStream(req: FilenameRequest, res: ExpressResponse, next: NextFunction): Promise<unknown>;
  getStaticVideoStreamMaster(req: VideoStreamIdRequest, res: ExpressResponse, next: NextFunction): void;
  getStaticVideoStreamSegment(req: VideoStreamSegmentRequest, res: ExpressResponse, next: NextFunction): void;
  uploadImage(req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<unknown>;
  uploadVideo(req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<unknown>;
  uploadVideoStream(req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<unknown>;
  getVideoStatus(req: VideoStreamIdRequest, res: ExpressResponse, next: NextFunction): Promise<unknown>;
}

@AutoBind()
export class MediaController extends BaseController implements IMediaController {
  constructor(
    private readonly getVideoStatusUC: GetVideoStatusPort,
    private readonly getStaticVideoStreamUC: GetStaticVideoStreamPort,
    private readonly uploadImageUC: UploadImagePort,
    private readonly uploadVideoUC: UploadVideoPort,
    private readonly uploadVideoStreamUC: UploadVideoStreamPort,
    private readonly s3Service: ObjectStoragePort,
    private readonly fileStorage: FileStoragePort
  ) {
    super();
  }

  getStaticImage(req: FilenameRequest, res: ExpressResponse) {
    const { filename } = req.params;
    const imagePath = path.resolve(UPLOAD_DIR_IMAGE, filename);
    if (!this.fileStorage.existsSync(imagePath)) {
      throw StaticMediaNotFoundException;
    }
    this.fileResponse<typeof imagePath>(res, imagePath);
  }

  getStaticVideo(req: FilenameRequest, res: ExpressResponse) {
    const { filename } = req.params;
    const videoPath = path.resolve(UPLOAD_DIR_VIDEO, filename);
    if (!this.fileStorage.existsSync(videoPath)) {
      throw StaticMediaNotFoundException;
    }
    this.fileResponse<typeof videoPath>(res, videoPath);
  }

  async getStaticVideoStream(req: FilenameRequest, res: ExpressResponse, next: NextFunction): Promise<void> {
    const { filename } = req.params;
    const { videoPath, videoSize, start, end, contentLength, contentType } = await this.getStaticVideoStreamUC.execute({
      filename,
      rangeHeader: req.headers.range
    });

    res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength.toString(),
      'Content-Type': contentType
    });

    const videoStream = this.fileStorage.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);

    videoStream.on('error', () => {
      // If headers were already sent, avoid next(error) because it can cause "headers already sent".
      if (!res.headersSent) {
        next(StaticVideoStreamInternalServerErrorException);
        return;
      }
      res.end();
    });
  }

  async getStaticVideoStreamMaster(req: VideoStreamIdRequest, res: ExpressResponse) {
    const { id } = req.params;
    await this.s3Service.streamFile(res, `videos-stream/${id}/master.m3u8`);
  }

  async getStaticVideoStreamSegment(req: VideoStreamSegmentRequest, res: ExpressResponse) {
    const { id, version, segment } = req.params;
    await this.s3Service.streamFile(res, `videos-stream/${id}/${version}/${segment}`);
  }

  async uploadImage(req: ExpressRequest) {
    const files = await parseUploadedFiles(req, 'image');

    const results = await this.uploadImageUC.execute({ files });

    return this.response<UploadImageOutputPort[]>({
      data: results,
      message: 'Upload successfully'
    });
  }

  async uploadVideo(req: ExpressRequest) {
    const files = await parseUploadedFiles(req, 'video');

    const results = await this.uploadVideoUC.execute({ files });

    return this.response<UploadVideoOutputPort[]>({
      data: results,
      message: 'Upload successfully'
    });
  }

  async uploadVideoStream(req: ExpressRequest) {
    const files = await parseUploadedFiles(req, 'video-stream');

    const results = await this.uploadVideoStreamUC.execute({ files });

    return this.response<UploadVideoStreamOutputPort[]>({
      data: results,
      message: 'Upload successfully'
    });
  }

  async getVideoStatus(req: VideoStreamIdRequest) {
    const { id } = req.params;
    const videoStatus = await this.getVideoStatusUC.execute({ name: id });

    if (!videoStatus) {
      throw VideoNotFoundException;
    }

    return this.response<GetVideoStatusOutputPort>({
      data: videoStatus,
      message: 'Get video status successfully'
    });
  }
}
