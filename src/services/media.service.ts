import { isDevelopment } from '@/constants/config.constant';
import { UPLOAD_DIR_IMAGE } from '@/constants/file.constant';
import { EEncodingVideoStatus, EMediaType } from '@/enums/media.enum';
import VideoStatusSchema from '@/models/schemas/videoStatus.schema';
import databaseService from '@/services/database.service';
import QueueService from '@/services/queue.service';
import { IMedia } from '@/types/media.type';
import { getNameFromFullname, handleUploadImage, handleUploadVideo, handleUploadVideoHLS } from '@/utils/file.util';
import { encodeHLSWithMultipleVideoStreams } from '@/utils/video';
import { Request } from 'express';
import fs from 'fs/promises';
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
        await sharp(file.filepath).resize(100, 100).jpeg().toFile(newPath);
        await fs.unlink(file.filepath);
        const url = isDevelopment ? process.env.DEVELOPMENT_URL : process.env.PRODUCTION_URL;
        return { url: `${url}/static/images/${newName}.jpg`, type: EMediaType.IMAGE };
      })
    );
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    return Promise.all<IMedia>(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename);
        const url = isDevelopment ? process.env.DEVELOPMENT_URL : process.env.PRODUCTION_URL;
        return { url: `${url}/static/videos/${newName}.mp4`, type: EMediaType.VIDEO };
      })
    );
  }

  async uploadVideoHLS(req: Request) {
    const files = await handleUploadVideoHLS(req);
    return Promise.all<IMedia>(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename);
        const idName = getNameFromFullname(file.newFilename.split('/').pop() as string);
        const url = isDevelopment ? process.env.DEVELOPMENT_URL : process.env.PRODUCTION_URL;

        this.queueService.enqueue(file.filepath, async () => {
          await databaseService.videoStatuses.insertOne(
            new VideoStatusSchema({ name: idName, status: EEncodingVideoStatus.PENDING })
          );
        });
        this.queueService.startProcessing(
          async (filepath) => {
            const currentIdName = getNameFromFullname(path.basename(filepath));
            await encodeHLSWithMultipleVideoStreams(filepath);
            await fs.unlink(filepath);
            return currentIdName;
          },
          async (filepath) => {
            const currentIdName = getNameFromFullname(path.basename(filepath));
            await databaseService.videoStatuses.updateOne(
              { name: currentIdName },
              { $set: { status: EEncodingVideoStatus.PROCESSING }, $currentDate: { updatedAt: true } }
            );
          },
          async (currentIdName) => {
            await databaseService.videoStatuses.updateOne(
              { name: currentIdName },
              { $set: { status: EEncodingVideoStatus.SUCCESS }, $currentDate: { updatedAt: true } }
            );
          },
          async (error, item) => {
            const currentIdName = getNameFromFullname(path.basename(item));
            await databaseService.videoStatuses.updateOne(
              { name: currentIdName },
              {
                $set: { status: EEncodingVideoStatus.FAILED, message: error.message },
                $currentDate: { updatedAt: true }
              }
            );
          }
        );

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
