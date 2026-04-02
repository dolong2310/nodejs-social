import {
  MAX_FILE_SIZE_IMAGE,
  MAX_FILE_SIZE_VIDEO,
  MAX_FILES_IMAGE,
  MAX_FILES_VIDEO,
  MAX_TOTAL_FILE_SIZE_IMAGE,
  UPLOAD_DIR_IMAGE_TEMP,
  UPLOAD_DIR_VIDEO,
  UPLOAD_DIR_VIDEO_TEMP
} from '@/constants/file.constant';
import { Request } from 'express';
import formidable, { File } from 'formidable';
import fs from 'fs';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import { v4 as uuidv4 } from 'uuid';
import YAML from 'yaml';

export const initUploadsFolder = () => {
  [UPLOAD_DIR_IMAGE_TEMP, UPLOAD_DIR_VIDEO_TEMP].forEach((dir) => {
    if (fs.existsSync(dir)) return;
    fs.mkdirSync(dir, { recursive: true });
  });
};

export const getNameFromFullname = (fullname: string) => {
  const nameArr = fullname.split('.');
  nameArr.pop();
  return nameArr.join('');
};

export const getExtensionFromFullname = (fullname: string) => {
  const nameArr = fullname.split('.');
  return nameArr[nameArr.length - 1];
};

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_DIR_IMAGE_TEMP,
    maxFiles: MAX_FILES_IMAGE,
    maxFileSize: MAX_FILE_SIZE_IMAGE,
    maxTotalFileSize: MAX_TOTAL_FILE_SIZE_IMAGE,
    keepExtensions: true,
    filter: ({ name, mimetype }) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/avif'].includes(mimetype || '');
      const isValidName = name === 'image';
      if (!isValidType || !isValidName) {
        form.emit('error', new Error('Invalid file type or name'));
      }
      return isValidType && isValidName;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      if (!('image' in files)) {
        return reject(new Error('Image file is required'));
      }

      resolve(files.image as File[]);
    });
  });
};

export const handleUploadVideo = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_DIR_VIDEO,
    maxFiles: MAX_FILES_VIDEO,
    maxFileSize: MAX_FILE_SIZE_VIDEO,
    // maxTotalFileSize: MAX_TOTAL_FILE_SIZE_VIDEO,
    // keepExtensions: true,
    filter: ({ name, mimetype }) => {
      const isValidType = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'].includes(mimetype || '');
      const isValidName = name === 'video';
      if (!isValidType || !isValidName) {
        form.emit('error', new Error('Invalid file type or name'));
      }
      return isValidType && isValidName;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      if (!('video' in files)) {
        return reject(new Error('Video file is required'));
      }

      const videoFiles = files.video as File[];

      try {
        for (const file of videoFiles) {
          const extension = getExtensionFromFullname(file.originalFilename as string);
          const newFilePath = `${file.filepath}.${extension}`;

          await fs.promises.rename(file.filepath, newFilePath);
          file.newFilename = `${file.newFilename}.${extension}`;
          file.filepath = newFilePath;
        }
      } catch (e) {
        return reject(e);
      }

      resolve(videoFiles);
    });
  });
};

export const handleUploadVideoHLS = async (req: Request) => {
  const uuid = uuidv4();
  const uploadDir = path.resolve(UPLOAD_DIR_VIDEO, uuid);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const form = formidable({
    uploadDir: uploadDir,
    maxFiles: MAX_FILES_VIDEO,
    maxFileSize: MAX_FILE_SIZE_VIDEO,
    // maxTotalFileSize: MAX_TOTAL_FILE_SIZE_VIDEO,
    // keepExtensions: true,
    filter: ({ name, mimetype }) => {
      const isValidType = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'].includes(mimetype || '');
      const isValidName = name === 'video';
      if (!isValidType || !isValidName) {
        form.emit('error', new Error('Invalid file type or name'));
      }
      return isValidType && isValidName;
    },
    filename: () => {
      return uuid;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      if (!('video' in files)) {
        return reject(new Error('Video file is required'));
      }

      const videoFiles = files.video as File[];

      try {
        for (const file of videoFiles) {
          const extension = getExtensionFromFullname(file.originalFilename as string);
          const newFilePath = `${file.filepath}.${extension}`;

          await fs.promises.rename(file.filepath, newFilePath);
          file.newFilename = `${file.newFilename}.${extension}`;
          file.filepath = newFilePath;
        }
      } catch (e) {
        return reject(e);
      }

      resolve(videoFiles);
    });
  });
};

/**
 * Giả sử:
 * dir = /hls/vid123
 * Trong đó có:
 * - master.m3u8
 * - v0/0.ts
 * - v0/1.ts
 * - sub/v1.ts
 * Thì output: [ "/hls/vid123/master.m3u8", "/hls/vid123/v0/0.ts", "/hls/vid123/v0/1.ts", "/hls/vid123/sub/v1.ts" ]
 */
export const getFiles = async (dir: string): Promise<string[]> => {
  const result: string[] = [];

  const walk = async (currentDir: string) => {
    const fileList = await fs.promises.readdir(currentDir);
    for (const file of fileList) {
      const fullPath = path.join(currentDir, file);
      const stat = await fs.promises.stat(fullPath);

      if (stat.isDirectory()) {
        await walk(fullPath);
      } else {
        result.push(fullPath);
      }
    }
  };

  await walk(dir);
  return result;
};

export const getSwaggerDefinition = (): swaggerJSDoc.Options['definition'] => {
  const generalPath = path.resolve(process.cwd(), 'swagger/general.yaml');
  const content = fs.readFileSync(generalPath, 'utf8');
  return YAML.parse(content);
};
