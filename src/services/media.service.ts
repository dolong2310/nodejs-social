import { isDevelopment } from '@/constants/config.constant';
import { UPLOAD_DIR_IMAGE } from '@/constants/file.constant';
import { MediaType } from '@/enums/media.enum';
import { IMedia } from '@/types/media.type';
import { getNameFromFullname, handleUploadImage, handleUploadVideo } from '@/utils/file.util';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

class MediaService {
  constructor() {}

  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);
    return Promise.all<IMedia>(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename);
        const newPath = path.resolve(UPLOAD_DIR_IMAGE, `${newName}.jpg`);
        await sharp(file.filepath).resize(100, 100).jpeg().toFile(newPath);
        fs.unlinkSync(file.filepath);
        const url = isDevelopment ? process.env.DEVELOPMENT_URL : process.env.PRODUCTION_URL;
        return { url: `${url}/static/images/${newName}.jpg`, type: MediaType.IMAGE };
      })
    );
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);
    return Promise.all<IMedia>(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename);
        const url = isDevelopment ? process.env.DEVELOPMENT_URL : process.env.PRODUCTION_URL;
        return { url: `${url}/static/videos/${newName}.mp4`, type: MediaType.VIDEO };
      })
    );
  }
}

export default new MediaService();
