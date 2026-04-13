import { UPLOAD_DIR_IMAGE_TEMP, UPLOAD_DIR_VIDEO_TEMP } from '@/presentation/http/constants/file.constant';

import fs from 'fs';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import YAML from 'yaml';

export const initUploadsFolder = () => {
  [UPLOAD_DIR_IMAGE_TEMP, UPLOAD_DIR_VIDEO_TEMP].forEach((dir) => {
    if (fs.existsSync(dir)) return;
    fs.mkdirSync(dir, { recursive: true });
  });
};

export const getSwaggerDefinition = (): swaggerJSDoc.Options['definition'] => {
  const generalPath = path.resolve(process.cwd(), 'swagger/general.yaml');
  const content = fs.readFileSync(generalPath, 'utf8');
  return YAML.parse(content);
};
