import { UPLOAD_DIR_IMAGE, UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { HTTP_ERROR_MESSAGE } from '@/constants/httpMessage.constant';
import { HTTP_STATUS } from '@/constants/httpStatus.constant';
import { BaseController } from '@/controllers/base.controller';
import { BadRequestError, InternalServerError, NotFoundError } from '@/responses/error.response';
import { OK } from '@/responses/success.response';
import { IMediaService } from '@/services/media.service';
import { IS3Service } from '@/services/s3.service';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import mime from 'mime';
import path from 'path';

export interface IMediaController {
  getStaticImage(req: Request<{ filename: string }>, res: Response, next: NextFunction): void;
  getStaticVideo(req: Request<{ filename: string }>, res: Response, next: NextFunction): void;
  getStaticVideoStream(req: Request<{ filename: string }>, res: Response, next: NextFunction): void;
  getStaticVideoHLSMaster(req: Request<{ id: string }>, res: Response, next: NextFunction): void;
  getStaticVideoHLSSegment(
    req: Request<{ id: string; version: string; segment: string }>,
    res: Response,
    next: NextFunction
  ): void;
  uploadImage(req: Request, res: Response, next: NextFunction): Promise<void>;
  uploadVideo(req: Request, res: Response, next: NextFunction): Promise<void>;
  uploadVideoHLS(req: Request, res: Response, next: NextFunction): Promise<void>;
  getVideoStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
}

class MediaController extends BaseController implements IMediaController {
  constructor(
    private readonly mediaService: IMediaService,
    private readonly s3Service: IS3Service
  ) {
    super();
  }

  getStaticImage = (req: Request<{ filename: string }>, res: Response, _next: NextFunction) => {
    const { filename } = req.params;
    const imagePath = path.resolve(UPLOAD_DIR_IMAGE, filename);
    if (!fs.existsSync(imagePath)) {
      throw new NotFoundError();
      // return res.status(HTTP_STATUS.NOT_FOUND).json({ message: HTTP_ERROR_MESSAGE.NOT_FOUND });
    }
    return res.sendFile(imagePath);
  };

  getStaticVideo = (req: Request<{ filename: string }>, res: Response, _next: NextFunction) => {
    const { filename } = req.params;
    const videoPath = path.resolve(UPLOAD_DIR_VIDEO, filename);
    if (!fs.existsSync(videoPath)) {
      throw new NotFoundError();
      // return res.status(HTTP_STATUS.NOT_FOUND).json({ message: HTTP_ERROR_MESSAGE.NOT_FOUND });
    }
    return res.sendFile(videoPath);
  };

  getStaticVideoStream = (req: Request<{ filename: string }>, res: Response, _next: NextFunction) => {
    const { filename } = req.params;
    const range = req.headers.range;
    if (!range) {
      throw new BadRequestError(
        HTTP_ERROR_MESSAGE.REQUESTED_RANGE_NOT_SATISFIABLE,
        HTTP_STATUS.REQUESTED_RANGE_NOT_SATISFIABLE
      );
      // return res
      //   .status(HTTP_STATUS.REQUESTED_RANGE_NOT_SATISFIABLE)
      //   .json({ message: HTTP_ERROR_MESSAGE.REQUESTED_RANGE_NOT_SATISFIABLE });
    }
    const videoPath = path.resolve(UPLOAD_DIR_VIDEO, filename);
    // 1MB = 10^6 bytes => tính theo hệ 10, đây là cách tính của JavaScript, chúng ta hay thấy trên UI
    // 1MB = 2^20 bytes (1024 * 1024) => tính theo hệ nhị phân
    const videoSize = fs.statSync(videoPath).size; // in bytes
    const chunkSize = 10 ** 6; // 1MB in bytes
    const start = Number(range.replace(/\D/g, '')); // lấy giá trị bytes từ header range ban đầu (vd: bytes=1024000-)
    const end = Math.min(start + chunkSize, videoSize - 1); // tính toán giá trị bytes từ start đến end range (vd: bytes=1024000-2048000), nếu vượt quá videoSize thì sẽ lấy videoSize - 1
    const contentLength = end - start + 1; // tính toán dung lượng thực tế cho mỗi chunk, thường sẽ là chunkSize, ngoại trừ đoạn chunk cuối cùng
    const contentType = mime.getType(videoPath) || 'video/*';
    /**
     * ChunkSize = 50
     * videoSize = 100
     * |0---------------50|51---------------100 (end = 99)
     * stream 1: start = 0, end = 50, contentLength = 51
     * stream 2: start = 51, end = 99, contentLength = 49
     */
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${videoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength.toString(),
      'Content-Type': contentType
    };
    res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers); // gửi header response cho client để client biết được phần content nào sẽ được trả về
    const videoStream = fs.createReadStream(videoPath, { start, end }); // tạo stream đọc file video từ start đến end range
    videoStream.pipe(res); // gửi stream cho client
    videoStream.on('end', () => {
      res.end(); // kết thúc stream
    });
    videoStream.on('error', (err) => {
      throw new InternalServerError();
      // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ message: HTTP_ERROR_MESSAGE.INTERNAL_SERVER_ERROR }); // xử lý lỗi nếu có
    });
    return videoStream; // trả về stream cho client
  };

  getStaticVideoHLSMaster = (req: Request<{ id: string }>, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    return this.s3Service.sendFileFromS3(res, `videos-hls/${id}/master.m3u8`);
  };

  getStaticVideoHLSSegment = (
    req: Request<{ id: string; version: string; segment: string }>,
    res: Response,
    _next: NextFunction
  ) => {
    const { id, version, segment } = req.params;
    return this.s3Service.sendFileFromS3(res, `videos-hls/${id}/${version}/${segment}`);
  };

  uploadImage = async (req: Request, res: Response, _next: NextFunction) => {
    const results = await this.mediaService.uploadImage(req);

    new OK({
      data: results,
      message: 'Upload successfully'
    }).send(res);
  };

  uploadVideo = async (req: Request, res: Response, _next: NextFunction) => {
    const results = await this.mediaService.uploadVideo(req);

    new OK({
      data: results,
      message: 'Upload successfully'
    }).send(res);
  };

  uploadVideoHLS = async (req: Request, res: Response, _next: NextFunction) => {
    const results = await this.mediaService.uploadVideoHLS(req);

    new OK({
      data: results,
      message: 'Upload successfully'
    }).send(res);
  };

  getVideoStatus = async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params as { id: string };
    const videoStatus = await this.mediaService.getVideoStatusByName(id);

    new OK({
      data: videoStatus,
      message: 'Get video status successfully'
    }).send(res);
  };
}

export default MediaController;
