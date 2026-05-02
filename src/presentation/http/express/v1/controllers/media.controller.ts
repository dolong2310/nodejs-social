import { FormidableFileUploadService } from '@/infrastructure/services/storages/file-upload.service';
import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { StoragePort } from '@/modules/core/application/ports/storage.port';
import { GetStaticVideoStreamInPort } from '@/modules/media/application/use-cases/get-static-video-stream/get-static-video-stream.in-port';
import {
  GetVideoStatusInPort,
  GetVideoStatusResult
} from '@/modules/media/application/use-cases/get-video-status/get-video-status.in-port';
import {
  UploadImageInPort,
  UploadImageResult
} from '@/modules/media/application/use-cases/upload-image/upload-image.in-port';
import {
  UploadVideoStreamInPort,
  UploadVideoStreamResult
} from '@/modules/media/application/use-cases/upload-video-stream/upload-video-stream.in-port';
import {
  UploadVideoInPort,
  UploadVideoResult
} from '@/modules/media/application/use-cases/upload-video/upload-video.in-port';
import { UPLOAD_DIR_IMAGE, UPLOAD_DIR_VIDEO } from '@/presentation/http/express/constants/file.constant';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import {
  StaticMediaNotFoundException,
  StaticVideoStreamInternalServerErrorException,
  VideoNotFoundException
} from '@/presentation/http/express/exceptions/media.exception';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constant';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { FilenameParamsDTO, VideoStreamParamsDTO } from '@/presentation/http/express/v1/dtos/media/media.request.dto';
import { NextFunction, Request, Response } from 'express';
import path from 'path';

export interface IMediaController {
  getStaticImage(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): void;
  getStaticVideo(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): void;
  getStaticVideoStream(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): Promise<void>;
  getStaticVideoStreamMaster(req: Request<Pick<VideoStreamParamsDTO, 'id'>>, res: Response, next: NextFunction): void;
  getStaticVideoStreamSegment(req: Request<VideoStreamParamsDTO>, res: Response, next: NextFunction): void;
  uploadImage(req: Request, res: Response, next: NextFunction): Promise<void>;
  uploadVideo(req: Request, res: Response, next: NextFunction): Promise<void>;
  uploadVideoStream(req: Request, res: Response, next: NextFunction): Promise<void>;
  getVideoStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export class MediaController extends BaseController implements IMediaController {
  constructor(
    private readonly getVideoStatusUC: GetVideoStatusInPort,
    private readonly getStaticVideoStreamUC: GetStaticVideoStreamInPort,
    private readonly uploadImageUC: UploadImageInPort,
    private readonly uploadVideoUC: UploadVideoInPort,
    private readonly uploadVideoStreamUC: UploadVideoStreamInPort,
    private readonly s3Service: StoragePort,
    private readonly fileStorage: FileStoragePort
  ) {
    super();
  }

  @AutoBind()
  getStaticImage(req: Request<FilenameParamsDTO>, res: Response) {
    const { filename } = req.params;
    const imagePath = path.resolve(UPLOAD_DIR_IMAGE, filename);
    if (!this.fileStorage.existsSync(imagePath)) {
      throw StaticMediaNotFoundException;
    }
    this.sendFileResponse<typeof imagePath>(res, imagePath);
  }

  @AutoBind()
  getStaticVideo(req: Request<FilenameParamsDTO>, res: Response) {
    const { filename } = req.params;
    const videoPath = path.resolve(UPLOAD_DIR_VIDEO, filename);
    if (!this.fileStorage.existsSync(videoPath)) {
      throw StaticMediaNotFoundException;
    }
    this.sendFileResponse<typeof videoPath>(res, videoPath);
  }

  @AutoBind()
  async getStaticVideoStream(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): Promise<void> {
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
      // Nếu đã gửi headers thì tránh gọi next(error) vì dễ "headers already sent"
      if (!res.headersSent) {
        next(StaticVideoStreamInternalServerErrorException);
        return;
      }
      res.end();
    });
  }

  @AutoBind()
  async getStaticVideoStreamMaster(req: Request<Pick<VideoStreamParamsDTO, 'id'>>, res: Response) {
    const { id } = req.params;
    await this.s3Service.sendFileFromS3(res, `videos-stream/${id}/master.m3u8`);
  }

  @AutoBind()
  async getStaticVideoStreamSegment(req: Request<VideoStreamParamsDTO>, res: Response) {
    const { id, version, segment } = req.params;
    await this.s3Service.sendFileFromS3(res, `videos-stream/${id}/${version}/${segment}`);
  }

  @AutoBind()
  async uploadImage(req: Request, res: Response) {
    const uploader = new FormidableFileUploadService(req);
    const files = await uploader.uploadImages();

    const results = await this.uploadImageUC.execute({ files });

    this.sendResponse<UploadImageResult[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async uploadVideo(req: Request, res: Response) {
    const uploader = new FormidableFileUploadService(req);
    const files = await uploader.uploadVideos();

    const results = await this.uploadVideoUC.execute({ files });

    this.sendResponse<UploadVideoResult[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async uploadVideoStream(req: Request, res: Response) {
    const uploader = new FormidableFileUploadService(req);
    const files = await uploader.uploadVideosStream();

    const results = await this.uploadVideoStreamUC.execute({ files });

    this.sendResponse<UploadVideoStreamResult[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async getVideoStatus(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const videoStatus = await this.getVideoStatusUC.execute({ name: id });

    if (!videoStatus) {
      throw VideoNotFoundException;
    }

    this.sendResponse<GetVideoStatusResult>({
      res,
      data: videoStatus,
      message: 'Get video status successfully'
    });
  }
}
