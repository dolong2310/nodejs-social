import { config } from '@/config';
import { UPLOAD_DIR_IMAGE } from '@/constants/file.constant';
import { EEncodingVideoStatus, EMediaType } from '@/enums/media.enum';
import { IVideoStatus } from '@/models/videoStatus.schema';
import { IVideoHLSJobQueue } from '@/queue/queues/video-hls.queue';
import { IMediaRepository } from '@/repositories/media.repository';
import { IS3Service } from '@/services/s3.service';
import { IMedia } from '@/types/media.type';
import { getNameFromFullname, handleUploadImage, handleUploadVideo, handleUploadVideoHLS } from '@/utils/file.util';
import { Request } from 'express';
import fs from 'fs/promises';
import mime from 'mime';
import path from 'path';
import sharp from 'sharp';

export interface IMediaService {
  uploadImage(req: Request): Promise<IMedia[]>;
  uploadVideo(req: Request): Promise<IMedia[]>;
  uploadVideoHLS(req: Request): Promise<IMedia[]>;
  getVideoStatusByName(name: string): Promise<IVideoStatus | null>;
}

class MediaService implements IMediaService {
  constructor(
    private readonly mediaRepository: IMediaRepository,
    private readonly s3Service: IS3Service,
    private readonly videoHLSJobQueue: IVideoHLSJobQueue
  ) {}

  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);
    return Promise.all<IMedia>(
      files.map(async (file) => {
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
        // const url = config.client.url;
        // return { url: `${url}/static/images/${newName}.jpg`, type: EMediaType.IMAGE };
      })
    );
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    return Promise.all<IMedia>(
      files.map(async (file) => {
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

        // const url = config.client.url;
        // return { url: `${url}/static/videos/${newName}.mp4`, type: EMediaType.VIDEO };
      })
    );
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideoHLS(req);
    return Promise.all<IMedia>(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename);
        const idName = getNameFromFullname(file.newFilename.split('/').pop() as string);
        await this.mediaRepository.createVideoStatus({ name: idName, status: EEncodingVideoStatus.PENDING });
        await this.videoHLSJobQueue.add({ filepath: file.filepath, idName });
        return { url: `${config.client.url}/static/videos-hls/${newName}/master.m3u8`, type: EMediaType.VIDEO_HLS };
        // Deprecated in-memory queue (replaced by BullMQ):
        // this.queueService.enqueue({
        //   item: file.filepath,
        //   onStart: async () => {
        //     await this.mediaRepository.createVideoStatus({ name: idName, status: EEncodingVideoStatus.PENDING });
        //   }
        // });
        // this.queueService.startProcessing({
        //   task: async (filepath) => {
        //     const currentIdName = getNameFromFullname(path.basename(filepath));
        //     await encodeHLSWithMultipleVideoStreams(filepath);
        //     await fs.unlink(filepath);

        //     const folderPath = path.resolve(UPLOAD_DIR_VIDEO, currentIdName);
        //     const filepaths = getFiles(folderPath); // lấy tất cả các file trong folder, vì khi encode hls sẽ tạo ra các file như m3u8, folder v0, ts,...

        //     await Promise.all(
        //       filepaths.map(async (_filepath) => {
        //         const filename = 'videos-hls' + _filepath.replace(path.resolve(UPLOAD_DIR_VIDEO), '');
        //         return this.s3Service.uploadFile({
        //           filename,
        //           filepath: _filepath,
        //           contentType: mime.getType(_filepath) ?? 'video/mp4'
        //         });
        //       })
        //     );

        //     // await Promise.all([fs.unlink(filepath), fs.rmdir(folderPath)]);
        //     await fs.rm(folderPath, { recursive: true, force: true });

        //     return currentIdName;
        //   },
        //   onProcess: async (filepath) => {
        //     const currentIdName = getNameFromFullname(path.basename(filepath));
        //     await this.mediaRepository.updateVideoStatus({
        //       name: currentIdName,
        //       status: EEncodingVideoStatus.PROCESSING
        //     });
        //   },
        //   onSuccess: async (currentIdName) => {
        //     await this.mediaRepository.updateVideoStatus({
        //       name: currentIdName,
        //       status: EEncodingVideoStatus.SUCCESS
        //     });
        //   },
        //   onError: async (error, item) => {
        //     const currentIdName = getNameFromFullname(path.basename(item));
        //     await this.mediaRepository.updateVideoStatus({
        //       name: currentIdName,
        //       status: EEncodingVideoStatus.FAILED,
        //       message: error.message
        //     });
        //   }
        // });
      })
    );
  }

  getVideoStatusByName(name: string): Promise<IVideoStatus | null> {
    return this.mediaRepository.findVideoStatusByName(name);
  }
}

export default MediaService;
