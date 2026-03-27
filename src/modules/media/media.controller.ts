import {
  HTTP_ERROR_MESSAGE,
  HTTP_STATUS,
  UPLOAD_DIR_IMAGE,
  UPLOAD_DIR_VIDEO,
  VALIDATION_ERROR_MESSAGE
} from '@/constants';
import { IMedia } from '@/interfaces';
import { BaseController, FilenameParamsDTO, IMediaService, VideoHLSParamsDTO } from '@/modules';
import { BadRequestError, InternalServerError, NotFoundError } from '@/providers';
import { IS3Service, IVideoStatus } from '@/shared';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import mime from 'mime';
import path from 'path';

export interface IMediaController {
  getStaticImage(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): void;
  getStaticVideo(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): void;
  getStaticVideoStream(req: Request<FilenameParamsDTO>, res: Response, next: NextFunction): void;
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
    private readonly s3Service: IS3Service
  ) {
    super();
  }

  getStaticImage = (req: Request<FilenameParamsDTO>, res: Response) => {
    const { filename } = req.params;
    const imagePath = path.resolve(UPLOAD_DIR_IMAGE, filename);
    if (!fs.existsSync(imagePath)) {
      throw new NotFoundError();
    }
    this.sendFileResponse<typeof imagePath>(res, imagePath);
  };

  getStaticVideo = (req: Request<FilenameParamsDTO>, res: Response) => {
    const { filename } = req.params;
    const videoPath = path.resolve(UPLOAD_DIR_VIDEO, filename);
    if (!fs.existsSync(videoPath)) {
      throw new NotFoundError();
    }
    this.sendFileResponse<typeof videoPath>(res, videoPath);
  };

  getStaticVideoStream = (req: Request<FilenameParamsDTO>, res: Response) => {
    const { filename } = req.params;
    const range = req.headers.range;
    if (!range) {
      throw new BadRequestError(
        HTTP_ERROR_MESSAGE.REQUESTED_RANGE_NOT_SATISFIABLE,
        HTTP_STATUS.REQUESTED_RANGE_NOT_SATISFIABLE
      );
    }
    const videoPath = path.resolve(UPLOAD_DIR_VIDEO, filename);
    const videoSize = fs.statSync(videoPath).size;
    const chunkSize = 10 ** 6;
    const start = Number(range.replace(/\D/g, ''));
    const end = Math.min(start + chunkSize, videoSize - 1);
    const contentLength = end - start + 1;
    const contentType = mime.getType(videoPath) || 'video/*';
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength.toString(),
      'Content-Type': contentType
    };
    res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
    videoStream.on('end', () => {
      res.end();
    });
    videoStream.on('error', () => {
      throw new InternalServerError();
    });
    return videoStream;
  };

  getStaticVideoHLSMaster = (req: Request<Pick<VideoHLSParamsDTO, 'id'>>, res: Response) => {
    const { id } = req.params;
    return this.s3Service.sendFileFromS3(res, `videos-hls/${id}/master.m3u8`);
  };

  getStaticVideoHLSSegment = (req: Request<VideoHLSParamsDTO>, res: Response) => {
    const { id, version, segment } = req.params;
    return this.s3Service.sendFileFromS3(res, `videos-hls/${id}/${version}/${segment}`);
  };

  uploadImage = async (req: Request, res: Response) => {
    const results = await this.mediaService.uploadImage(req);

    this.sendResponse<IMedia[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  };

  uploadVideo = async (req: Request, res: Response) => {
    const results = await this.mediaService.uploadVideo(req);

    this.sendResponse<IMedia[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  };

  uploadVideoHLS = async (req: Request, res: Response) => {
    const results = await this.mediaService.uploadVideoHLS(req);

    this.sendResponse<IMedia[]>({
      res,
      data: results,
      message: 'Upload successfully'
    });
  };

  getVideoStatus = async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const videoStatus = await this.mediaService.getVideoStatusByName(id);

    if (!videoStatus) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.VIDEO_NOT_FOUND);
    }

    this.sendResponse<IVideoStatus>({
      res,
      data: videoStatus,
      message: 'Get video status successfully'
    });
  };
}
