import { isDevelopment } from '@/constants/config.constant';
import { UPLOAD_DIR } from '@/constants/file.constant';
import { getNameFromFullname, handleUploadImage } from '@/utils/file.util';
import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

class MediaService {
  constructor() {}

  async uploadImage(req: Request) {
    const file = await handleUploadImage(req);
    const newName = getNameFromFullname(file.newFilename);
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`);
    await sharp(file.filepath).resize(100, 100).jpeg().toFile(newPath);
    fs.unlinkSync(file.filepath);
    const url = isDevelopment ? process.env.DEVELOPMENT_URL : process.env.PRODUCTION_URL;
    return `${url}/uploads/${newName}.jpg`;
  }
}

export default new MediaService();
