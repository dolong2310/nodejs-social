import { UploadMediaResultDTO, VideoStatusResultDTO } from '@/application/dtos/media/media.result.dto';
import {
  StaticMediaNotFoundException,
  StaticVideoStreamInternalServerErrorException,
  VideoNotFoundException
} from '@/application/errors/media.error';
import { IFileStorage } from '@/application/ports/file-storage.port';
import { IMediaService } from '@/application/ports/media.port';
import { IPathService } from '@/application/ports/path.port';
import { IS3Service } from '@/application/ports/s3.port';

import { FormidableFileUploadService } from '@/infrastructure/services/storages/file-upload.service';

import { UPLOAD_DIR_IMAGE, UPLOAD_DIR_VIDEO } from '@/presentation/http/constants/file.constant';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { FilenameParamsDTO, VideoHLSParamsDTO } from '@/presentation/http/dtos/media/media.request.dto';
import { HTTP_STATUS } from '@/presentation/http/responses/http-status.constant';

import { NextFunction, Request, Response } from 'express';

export interface IMediaController {
  getStaticImage(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): void;
  getStaticVideo(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): void;
  getStaticVideoStream(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): Promise<void>;
  getStaticVideoHLSMaster(req: Request<Pick<VideoHLSParamsDTO, 'id'>>, res: Response, next: NextFunction): void;
  getStaticVideoHLSSegment(req: Request<VideoHLSParamsDTO>, res: Response, next: NextFunction): void;
  uploadImage(req: Request, res: Response, next: NextFunction): Promise<void>;
  uploadVideo(req: Request, res: Response, next: NextFunction): Promise<void>;
  uploadVideoHLS(req: Request, res: Response, next: NextFunction): Promise<void>;
  getVideoStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export class MediaController extends BaseController implements IMediaController {
  constructor(
    private readonly mediaService: IMediaService,
    private readonly s3Service: IS3Service,
    private readonly fileStorage: IFileStorage,
    private readonly pathService: IPathService
  ) {
    super();
  }

  @AutoBind()
  getStaticImage(req: Request<FilenameParamsDTO>, res: Response) {
    const { filename } = req.params;
    const imagePath = this.pathService.resolve(UPLOAD_DIR_IMAGE, filename);
    if (!this.fileStorage.existsSync(imagePath)) {
      throw StaticMediaNotFoundException;
    }
    this.sendFileResponse<typeof imagePath>(res, imagePath);
  }

  @AutoBind()
  getStaticVideo(req: Request<FilenameParamsDTO>, res: Response) {
    const { filename } = req.params;
    const videoPath = this.pathService.resolve(UPLOAD_DIR_VIDEO, filename);
    if (!this.fileStorage.existsSync(videoPath)) {
      throw StaticMediaNotFoundException;
    }
    this.sendFileResponse<typeof videoPath>(res, videoPath);
  }

  @AutoBind()
  async getStaticVideoStream(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): Promise<void> {
    const { filename } = req.params;
    const { videoPath, videoSize, start, end, contentLength, contentType } =
      await this.mediaService.getStaticVideoStream({ filename, rangeHeader: req.headers.range });

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
  async getStaticVideoHLSMaster(req: Request<Pick<VideoHLSParamsDTO, 'id'>>, res: Response) {
    const { id } = req.params;
    await this.s3Service.sendFileFromS3(res, `videos-hls/${id}/master.m3u8`);
  }

  @AutoBind()
  async getStaticVideoHLSSegment(req: Request<VideoHLSParamsDTO>, res: Response) {
    const { id, version, segment } = req.params;
    await this.s3Service.sendFileFromS3(res, `videos-hls/${id}/${version}/${segment}`);
  }

  @AutoBind()
  async uploadImage(req: Request, res: Response) {
    const uploader = new FormidableFileUploadService(req);
    const files = await uploader.uploadImages();

    const results = await this.mediaService.uploadImage({ files });

    this.sendResponse<UploadMediaResultDTO[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async uploadVideo(req: Request, res: Response) {
    const uploader = new FormidableFileUploadService(req);
    const files = await uploader.uploadVideos();

    const results = await this.mediaService.uploadVideo({ files });

    this.sendResponse<UploadMediaResultDTO[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async uploadVideoHLS(req: Request, res: Response) {
    const uploader = new FormidableFileUploadService(req);
    const files = await uploader.uploadVideosHLS();

    const results = await this.mediaService.uploadVideoHLS({ files });

    this.sendResponse<UploadMediaResultDTO[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async getVideoStatus(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const videoStatus = await this.mediaService.getVideoStatusByName({ name: id });

    if (!videoStatus) {
      throw VideoNotFoundException;
    }

    this.sendResponse<VideoStatusResultDTO>({
      res,
      data: videoStatus,
      message: 'Get video status successfully'
    });
  }
}
