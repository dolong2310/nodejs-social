import { UPLOAD_DIR_IMAGE, UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { HTTP_STATUS } from '@/constants/httpStatus.constant';
import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { IMedia } from '@/interfaces/types/media.type';
import { BaseController } from '@/modules/base/base.controller';
import { FilenameParamsDTO, VideoHLSParamsDTO } from '@/modules/media/dtos/media.request.dto';
import {
  StaticMediaNotFoundException,
  StaticVideoStreamInternalServerErrorException,
  VideoNotFoundException
} from '@/modules/media/media.exception';
import { MediaService } from '@/modules/media/media.service';
import { IVideoStatus } from '@/modules/media/videoStatus.schema';
import { S3Service } from '@/shared/services/s3.service';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

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

@Injectable()
export class MediaController extends BaseController implements IMediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly s3Service: S3Service
  ) {
    super();
  }

  @AutoBind()
  getStaticImage(req: Request<FilenameParamsDTO>, res: Response) {
    const { filename } = req.params;
    const imagePath = path.resolve(UPLOAD_DIR_IMAGE, filename);
    if (!fs.existsSync(imagePath)) {
      throw StaticMediaNotFoundException;
    }
    this.sendFileResponse<typeof imagePath>(res, imagePath);
  }

  @AutoBind()
  getStaticVideo(req: Request<FilenameParamsDTO>, res: Response) {
    const { filename } = req.params;
    const videoPath = path.resolve(UPLOAD_DIR_VIDEO, filename);
    if (!fs.existsSync(videoPath)) {
      throw StaticMediaNotFoundException;
    }
    this.sendFileResponse<typeof videoPath>(res, videoPath);
  }

  @AutoBind()
  async getStaticVideoStream(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): Promise<void> {
    const { filename } = req.params;
    const { videoPath, videoSize, start, end, contentLength, contentType } =
      await this.mediaService.getStaticVideoStream(filename, req.headers.range);

    res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength.toString(),
      'Content-Type': contentType
    });

    const videoStream = fs.createReadStream(videoPath, { start, end });
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
  getStaticVideoHLSMaster(req: Request<Pick<VideoHLSParamsDTO, 'id'>>, res: Response) {
    const { id } = req.params;
    return this.s3Service.sendFileFromS3(res, `videos-hls/${id}/master.m3u8`);
  }

  @AutoBind()
  getStaticVideoHLSSegment(req: Request<VideoHLSParamsDTO>, res: Response) {
    const { id, version, segment } = req.params;
    return this.s3Service.sendFileFromS3(res, `videos-hls/${id}/${version}/${segment}`);
  }

  @AutoBind()
  async uploadImage(req: Request, res: Response) {
    const results = await this.mediaService.uploadImage(req);

    this.sendResponse<IMedia[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async uploadVideo(req: Request, res: Response) {
    const results = await this.mediaService.uploadVideo(req);

    this.sendResponse<IMedia[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async uploadVideoHLS(req: Request, res: Response) {
    const results = await this.mediaService.uploadVideoHLS(req);

    this.sendResponse<IMedia[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  }

  @AutoBind()
  async getVideoStatus(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const videoStatus = await this.mediaService.getVideoStatusByName(id);

    if (!videoStatus) {
      throw VideoNotFoundException;
    }

    this.sendResponse<IVideoStatus>({
      res,
      data: videoStatus,
      message: 'Get video status successfully'
    });
  }
}
