import { config } from '@/config/generalConfig';
import { UPLOAD_DIR_IMAGE, UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { Injectable } from '@/decorators/injectable.decorator';
import { IMedia } from '@/interfaces/types/media.type';
import { EEncodingVideoStatus, EMediaType } from '@/modules/media/media.enum';
import { RequestedRangeNotSatisfiableException } from '@/modules/media/media.exception';
import { MediaRepository } from '@/modules/media/media.repository';
import { VideoHLSJobQueue } from '@/providers/queue/queues/video-hls.queue';
import { IVideoStatus } from '@/modules/media/videoStatus.schema';
import { S3Service } from '@/shared/services/s3.service';
import { mapWithConcurrency } from '@/utils/concurrency.util';
import { getNameFromFullname, handleUploadImage, handleUploadVideo, handleUploadVideoHLS } from '@/utils/file.util';
import { Request } from 'express';
import fs from 'fs/promises';
import mime from 'mime';
import path from 'path';
import sharp from 'sharp';
import { IStaticVideoStreamPayload } from '@/modules/media/dtos/media.response.dto';

export interface IMediaService {
  getStaticVideoStream(filename: string, rangeHeader: string | undefined): Promise<IStaticVideoStreamPayload>;
  uploadImage(req: Request): Promise<IMedia[]>;
  uploadVideo(req: Request): Promise<IMedia[]>;
  uploadVideoHLS(req: Request): Promise<IMedia[]>;
  getVideoStatusByName(name: string): Promise<IVideoStatus | null>;
}

@Injectable()
export class MediaService implements IMediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly s3Service: S3Service,
    private readonly videoHLSJobQueue: VideoHLSJobQueue
  ) {}

  async getStaticVideoStream(filename: string, rangeHeader: string | undefined): Promise<IStaticVideoStreamPayload> {
    if (!rangeHeader) {
      throw RequestedRangeNotSatisfiableException;
    }

    const videoPath = path.resolve(UPLOAD_DIR_VIDEO, filename);
    const videoStat = await fs.stat(videoPath);
    const videoSize = videoStat.size;

    const chunkSize = 10 ** 6;
    const match = /^bytes=(\d+)-(\d*)$/i.exec(rangeHeader);
    if (!match) {
      throw RequestedRangeNotSatisfiableException;
    }

    const start = Number(match[1]);
    const endFromHeader = match[2] ? Number(match[2]) : null;

    if (!Number.isFinite(start) || start < 0 || start >= videoSize) {
      throw RequestedRangeNotSatisfiableException;
    }

    let end: number;
    if (endFromHeader !== null && Number.isFinite(endFromHeader)) {
      if (endFromHeader < start) {
        throw RequestedRangeNotSatisfiableException;
      }
      end = Math.min(endFromHeader, videoSize - 1);
    } else {
      end = Math.min(start + chunkSize - 1, videoSize - 1);
    }

    const contentLength = end - start + 1;
    const contentType = mime.getType(videoPath) || 'application/octet-stream';
    return {
      videoPath,
      videoSize,
      start,
      end,
      contentLength,
      contentType
    };
  }

  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);
    const concurrency = 2;

    return mapWithConcurrency(files, concurrency, async (file) => {
      const newName = getNameFromFullname(file.newFilename);
      const newPath = path.resolve(UPLOAD_DIR_IMAGE, `${newName}.jpg`);
      await sharp(file.filepath).jpeg().toFile(newPath);

      const result = await this.s3Service.uploadFile({
        filename: 'images/' + newName,
        filepath: newPath,
        contentType: mime.getType(newPath) ?? 'application/octet-stream'
      });

      await Promise.all([fs.unlink(file.filepath), fs.unlink(newPath)]);

      return {
        url: result.Location ?? '',
        type: EMediaType.IMAGE
      };
    });
    // return Promise.all<IMedia>(
    //   files.map(async (file) => {
    //     const newName = getNameFromFullname(file.newFilename);
    //     const newPath = path.resolve(UPLOAD_DIR_IMAGE, `${newName}.jpg`);
    //     await sharp(file.filepath).jpeg().toFile(newPath);

    //     const result = await this.s3Service.uploadFile({
    //       filename: 'images/' + newName,
    //       filepath: newPath,
    //       contentType: mime.getType(newPath) ?? 'application/octet-stream'
    //     });

    //     await Promise.all([fs.unlink(file.filepath), fs.unlink(newPath)]);

    //     return {
    //       url: result.Location ?? '',
    //       type: EMediaType.IMAGE
    //     };
    //     // const url = config.client.url;
    //     // return { url: `${url}/static/images/${newName}.jpg`, type: EMediaType.IMAGE };
    //   })
    // );
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    const concurrency = 2;

    return mapWithConcurrency(files, concurrency, async (file) => {
      const newName = getNameFromFullname(file.newFilename);
      const result = await this.s3Service.uploadFile({
        filename: 'videos/' + newName,
        filepath: file.filepath,
        contentType: mime.getType(file.filepath) ?? 'video/mp4'
      });

      await fs.unlink(file.filepath);

      return {
        url: result.Location ?? '',
        type: EMediaType.VIDEO
      };
    });
    // return Promise.all<IMedia>(
    //   files.map(async (file) => {
    //     const newName = getNameFromFullname(file.newFilename);

    //     const result = await this.s3Service.uploadFile({
    //       filename: 'videos/' + newName,
    //       filepath: file.filepath,
    //       contentType: mime.getType(file.filepath) ?? 'video/mp4'
    //     });

    //     await fs.unlink(file.filepath);

    //     return {
    //       url: result.Location ?? '',
    //       type: EMediaType.VIDEO
    //     };

    //     // const url = config.client.url;
    //     // return { url: `${url}/static/videos/${newName}.mp4`, type: EMediaType.VIDEO };
    //   })
    // );
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideoHLS(req);
    const concurrency = 2;

    return mapWithConcurrency(files, concurrency, async (file) => {
      const newName = getNameFromFullname(file.newFilename);
      const idName = getNameFromFullname(file.newFilename.split('/').pop() as string);
      await this.mediaRepository.createVideoStatus({ name: idName, status: EEncodingVideoStatus.PENDING });
      void this.videoHLSJobQueue.add({ filepath: file.filepath, idName }).catch(async (err) => {
        await this.mediaRepository.updateVideoStatus({
          name: idName,
          status: EEncodingVideoStatus.FAILED,
          message: (err instanceof Error ? err.message : err?.message) ?? 'Enqueue video HLS job failed'
        });
      });
      return { url: `${config.client.url}/static/videos-hls/${newName}/master.m3u8`, type: EMediaType.VIDEO_HLS };
    });
    // return Promise.all<IMedia>(
    //   files.map(async (file) => {
    //     const newName = getNameFromFullname(file.newFilename);
    //     const idName = getNameFromFullname(file.newFilename.split('/').pop() as string);
    //     await this.mediaRepository.createVideoStatus({ name: idName, status: EEncodingVideoStatus.PENDING });
    //     await this.videoHLSJobQueue.add({ filepath: file.filepath, idName });
    //     return { url: `${config.client.url}/static/videos-hls/${newName}/master.m3u8`, type: EMediaType.VIDEO_HLS };
    //     // Deprecated in-memory queue (replaced by BullMQ):
    //     // this.queueService.enqueue({
    //     //   item: file.filepath,
    //     //   onStart: async () => {
    //     //     await this.mediaRepository.createVideoStatus({ name: idName, status: EEncodingVideoStatus.PENDING });
    //     //   }
    //     // });
    //     // this.queueService.startProcessing({
    //     //   task: async (filepath) => {
    //     //     const currentIdName = getNameFromFullname(path.basename(filepath));
    //     //     await encodeHLSWithMultipleVideoStreams(filepath);
    //     //     await fs.unlink(filepath);

    //     //     const folderPath = path.resolve(UPLOAD_DIR_VIDEO, currentIdName);
    //     //     const filepaths = getFiles(folderPath); // lấy tất cả các file trong folder, vì khi encode hls sẽ tạo ra các file như m3u8, folder v0, ts,...

    //     //     await Promise.all(
    //     //       filepaths.map(async (_filepath) => {
    //     //         const filename = 'videos-hls' + _filepath.replace(path.resolve(UPLOAD_DIR_VIDEO), '');
    //     //         return this.s3Service.uploadFile({
    //     //           filename,
    //     //           filepath: _filepath,
    //     //           contentType: mime.getType(_filepath) ?? 'video/mp4'
    //     //         });
    //     //       })
    //     //     );

    //     //     // await Promise.all([fs.unlink(filepath), fs.rmdir(folderPath)]);
    //     //     await fs.rm(folderPath, { recursive: true, force: true });

    //     //     return currentIdName;
    //     //   },
    //     //   onProcess: async (filepath) => {
    //     //     const currentIdName = getNameFromFullname(path.basename(filepath));
    //     //     await this.mediaRepository.updateVideoStatus({
    //     //       name: currentIdName,
    //     //       status: EEncodingVideoStatus.PROCESSING
    //     //     });
    //     //   },
    //     //   onSuccess: async (currentIdName) => {
    //     //     await this.mediaRepository.updateVideoStatus({
    //     //       name: currentIdName,
    //     //       status: EEncodingVideoStatus.SUCCESS
    //     //     });
    //     //   },
    //     //   onError: async (error, item) => {
    //     //     const currentIdName = getNameFromFullname(path.basename(item));
    //     //     await this.mediaRepository.updateVideoStatus({
    //     //       name: currentIdName,
    //     //       status: EEncodingVideoStatus.FAILED,
    //     //       message: error.message
    //     //     });
    //     //   }
    //     // });
    //   })
    // );
  }

  getVideoStatusByName(name: string): Promise<IVideoStatus | null> {
    return this.mediaRepository.findVideoStatusByName(name);
  }
}
