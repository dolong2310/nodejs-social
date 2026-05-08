import { FileStoragePort } from '@/modules/media/application/ports/file-storage.port';
import { ObjectStoragePort } from '@/modules/media/application/ports/object-storage.port';
import { GetStaticVideoStreamPort } from '@/modules/media/application/use-cases/get-static-video-stream/get-static-video-stream.port';
import {
  GetVideoStatusPort,
  GetVideoStatusResult
} from '@/modules/media/application/use-cases/get-video-status/get-video-status.port';
import {
  UploadImagePort,
  UploadImageResult
} from '@/modules/media/application/use-cases/upload-image/upload-image.port';
import {
  UploadVideoStreamPort,
  UploadVideoStreamResult
} from '@/modules/media/application/use-cases/upload-video-stream/upload-video-stream.port';
import {
  UploadVideoPort,
  UploadVideoResult
} from '@/modules/media/application/use-cases/upload-video/upload-video.port';
import { UPLOAD_DIR_IMAGE, UPLOAD_DIR_VIDEO } from '@/presentation/http/express/constants/file.constant';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import {
  StaticMediaNotFoundException,
  StaticVideoStreamInternalServerErrorException,
  VideoNotFoundException
} from '@/presentation/http/express/exceptions/media.exception';
import { HTTP_STATUS } from '@/presentation/http/express/responses/http-status.constant';
import { parseUploadedFiles } from '@/presentation/http/express/utils/parse-uploaded-files.util';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { FilenameParamsDTO, VideoStreamParamsDTO } from '@/presentation/http/express/v1/dtos/media/media.request.dto';
import { NextFunction, Request, Response } from 'express';
import path from 'path';

export interface IMediaController {
  getStaticImage(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): void;
  getStaticVideo(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): void;
  getStaticVideoStream(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): Promise<unknown>;
  getStaticVideoStreamMaster(req: Request<Pick<VideoStreamParamsDTO, 'id'>>, res: Response, next: NextFunction): void;
  getStaticVideoStreamSegment(req: Request<VideoStreamParamsDTO>, res: Response, next: NextFunction): void;
  uploadImage(req: Request, res: Response, next: NextFunction): Promise<unknown>;
  uploadVideo(req: Request, res: Response, next: NextFunction): Promise<unknown>;
  uploadVideoStream(req: Request, res: Response, next: NextFunction): Promise<unknown>;
  getVideoStatus(req: Request, res: Response, next: NextFunction): Promise<unknown>;
}

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

  @AutoBind()
  getStaticImage(req: Request<FilenameParamsDTO>, res: Response) {
    const { filename } = req.params;
    const imagePath = path.resolve(UPLOAD_DIR_IMAGE, filename);
    if (!this.fileStorage.existsSync(imagePath)) {
      throw StaticMediaNotFoundException;
    }
    this.fileResponse<typeof imagePath>(res, imagePath);
  }

  @AutoBind()
  getStaticVideo(req: Request<FilenameParamsDTO>, res: Response) {
    const { filename } = req.params;
    const videoPath = path.resolve(UPLOAD_DIR_VIDEO, filename);
    if (!this.fileStorage.existsSync(videoPath)) {
      throw StaticMediaNotFoundException;
    }
    this.fileResponse<typeof videoPath>(res, videoPath);
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
    await this.s3Service.streamFile(res, `videos-stream/${id}/master.m3u8`);
  }

  @AutoBind()
  async getStaticVideoStreamSegment(req: Request<VideoStreamParamsDTO>, res: Response) {
    const { id, version, segment } = req.params;
    await this.s3Service.streamFile(res, `videos-stream/${id}/${version}/${segment}`);
  }

  @AutoBind()
  async uploadImage(req: Request) {
    const files = await parseUploadedFiles(req, 'image');

    const results = await this.uploadImageUC.execute({ files });

    return this.response<UploadImageResult[]>({
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async uploadVideo(req: Request) {
    const files = await parseUploadedFiles(req, 'video');

    const results = await this.uploadVideoUC.execute({ files });

    return this.response<UploadVideoResult[]>({
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async uploadVideoStream(req: Request) {
    const files = await parseUploadedFiles(req, 'video-stream');

    const results = await this.uploadVideoStreamUC.execute({ files });

    return this.response<UploadVideoStreamResult[]>({
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async getVideoStatus(req: Request) {
    const { id } = req.params as { id: string };
    const videoStatus = await this.getVideoStatusUC.execute({ name: id });

    if (!videoStatus) {
      throw VideoNotFoundException;
    }

    return this.response<GetVideoStatusResult>({
      data: videoStatus,
      message: 'Get video status successfully'
    });
  }
}
