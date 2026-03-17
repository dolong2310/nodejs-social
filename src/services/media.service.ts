import { envConfig, isDevelopment } from '@/constants/config.constant';
import { UPLOAD_DIR_IMAGE, UPLOAD_DIR_VIDEO } from '@/constants/file.constant';
import { EEncodingVideoStatus, EMediaType } from '@/enums/media.enum';
import VideoStatusSchema from '@/models/schemas/videoStatus.schema';
import databaseService from '@/services/database.service';
import QueueService from '@/services/queue.service';
import s3Service from '@/services/s3.service';
import { IMedia } from '@/types/media.type';
import {
  getFiles,
  getNameFromFullname,
  handleUploadImage,
  handleUploadVideo,
  handleUploadVideoHLS
} from '@/utils/file.util';
import { encodeHLSWithMultipleVideoStreams } from '@/utils/video';
import { Request } from 'express';
import fs from 'fs/promises';
import mime from 'mime';
import path from 'path';
import sharp from 'sharp';

class MediaService {
  private queueService: QueueService;
  constructor() {
    this.queueService = new QueueService({ onStartWhenEnqueue: true });
  }

  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);
    return Promise.all<IMedia>(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename);
        const newPath = path.resolve(UPLOAD_DIR_IMAGE, `${newName}.jpg`);
        await sharp(file.filepath).jpeg().toFile(newPath);

        const result = await s3Service.uploadFile({
          filename: 'images/' + newName,
          filepath: newPath,
          contentType: mime.getType(newPath) ?? 'application/octet-stream'
        });

        await Promise.all([fs.unlink(file.filepath), fs.unlink(newPath)]);

        return {
          url: result.Location ?? '',
          type: EMediaType.IMAGE
        };
        // const url = isDevelopment ? envConfig.DEVELOPMENT_URL : envConfig.PRODUCTION_URL;
        // return { url: `${url}/static/images/${newName}.jpg`, type: EMediaType.IMAGE };
      })
    );
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    return Promise.all<IMedia>(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename);

        const result = await s3Service.uploadFile({
          filename: 'videos/' + newName,
          filepath: file.filepath,
          contentType: mime.getType(file.filepath) ?? 'video/mp4'
        });

        await fs.unlink(file.filepath);

        return {
          url: result.Location ?? '',
          type: EMediaType.VIDEO
        };

        // const url = isDevelopment ? envConfig.DEVELOPMENT_URL : envConfig.PRODUCTION_URL;
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
        const url = isDevelopment ? envConfig.DEVELOPMENT_URL : envConfig.PRODUCTION_URL;

        this.queueService.enqueue({
          item: file.filepath,
          onStart: async () => {
            await databaseService.videoStatuses.insertOne(
              new VideoStatusSchema({ name: idName, status: EEncodingVideoStatus.PENDING })
            );
          }
        });
        this.queueService.startProcessing({
          task: async (filepath) => {
            const currentIdName = getNameFromFullname(path.basename(filepath));
            await encodeHLSWithMultipleVideoStreams(filepath);
            await fs.unlink(filepath);

            const folderPath = path.resolve(UPLOAD_DIR_VIDEO, currentIdName);
            const filepaths = getFiles(folderPath); // lấy tất cả các file trong folder, vì khi encode hls sẽ tạo ra các file như m3u8, folder v0, ts,...

            await Promise.all(
              filepaths.map(async (_filepath) => {
                const filename = 'videos-hls' + _filepath.replace(path.resolve(UPLOAD_DIR_VIDEO), '');
                return s3Service.uploadFile({
                  filename,
                  filepath: _filepath,
                  contentType: mime.getType(_filepath) ?? 'video/mp4'
                });
              })
            );

            // await Promise.all([fs.unlink(filepath), fs.rmdir(folderPath)]);
            await fs.rm(folderPath, { recursive: true, force: true });

            return currentIdName;
          },
          onProcess: async (filepath) => {
            const currentIdName = getNameFromFullname(path.basename(filepath));
            await databaseService.videoStatuses.updateOne(
              { name: currentIdName },
              { $set: { status: EEncodingVideoStatus.PROCESSING }, $currentDate: { updatedAt: true } }
            );
          },
          onSuccess: async (currentIdName) => {
            await databaseService.videoStatuses.updateOne(
              { name: currentIdName },
              { $set: { status: EEncodingVideoStatus.SUCCESS }, $currentDate: { updatedAt: true } }
            );
          },
          onError: async (error, item) => {
            const currentIdName = getNameFromFullname(path.basename(item));
            await databaseService.videoStatuses.updateOne(
              { name: currentIdName },
              {
                $set: { status: EEncodingVideoStatus.FAILED, message: error.message },
                $currentDate: { updatedAt: true }
              }
            );
          }
        });

        return { url: `${url}/static/videos-hls/${newName}/master.m3u8`, type: EMediaType.VIDEO_HLS };
      })
    );
  }

  async getVideoStatusById(id: string) {
    const videoStatus = await databaseService.videoStatuses.findOne({ name: id });
    return videoStatus;
  }
}

export default new MediaService();
