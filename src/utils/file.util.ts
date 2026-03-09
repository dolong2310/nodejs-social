import { UPLOAD_DIR_TEMP } from '@/constants/file.constant';
import { Request } from 'express';
import formidable, { File } from 'formidable';
import fs from 'fs';

const MAX_FILES = 4;
const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB
const MAX_TOTAL_FILE_SIZE = MAX_FILE_SIZE * MAX_FILES;

export const initUploadsFolder = () => {
  if (fs.existsSync(UPLOAD_DIR_TEMP)) return;
  fs.mkdirSync(UPLOAD_DIR_TEMP, { recursive: true });
};

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_DIR_TEMP,
    maxFiles: MAX_FILES,
    maxFileSize: MAX_FILE_SIZE,
    maxTotalFileSize: MAX_TOTAL_FILE_SIZE,
    keepExtensions: true,
    filter: ({ name, originalFilename, mimetype }) => {
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
        return reject(new Error('File is required'));
      }

      resolve(files.image as File[]);
    });
  });
};

export const getNameFromFullname = (fullname: string) => {
  const nameArr = fullname.split('.');
  nameArr.pop();
  return nameArr.join('');
};
