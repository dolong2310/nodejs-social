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
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      if (!('video' in files)) {
        return reject(new Error('Video file is required'));
      }

      const videoFiles = files.video as File[];

      videoFiles.forEach((file) => {
        const extension = getExtensionFromFullname(file.originalFilename as string);
        fs.renameSync(file.filepath, `${file.filepath}.${extension}`);
        file.newFilename = `${file.newFilename}.${extension}`;
        file.filepath = `${file.filepath}.${extension}`;
      });

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
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      if (!('video' in files)) {
        return reject(new Error('Video file is required'));
      }

      const videoFiles = files.video as File[];

      videoFiles.forEach((file) => {
        const extension = getExtensionFromFullname(file.originalFilename as string);
        fs.renameSync(file.filepath, `${file.filepath}.${extension}`);
        file.newFilename = `${file.newFilename}.${extension}`;
        file.filepath = `${file.filepath}.${extension}`;
      });

      resolve(videoFiles);
    });
  });
};

export const getFiles = (dir: string, files: string[] = []): string[] => {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = `${dir}/${file}`;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
};

export const getSwaggerDefinition = (): swaggerJSDoc.Options['definition'] => {
  const generalPath = path.resolve(__dirname, '../../swagger/general.yaml');
  const content = fs.readFileSync(generalPath, 'utf8');
  return YAML.parse(content);
};
