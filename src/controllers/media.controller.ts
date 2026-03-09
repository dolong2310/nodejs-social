import { UPLOAD_DIR } from '@/constants/file.constant';
import HTTP_STATUS from '@/constants/httpStatus.constant';
import { ERROR_MESSAGE } from '@/constants/message.constant';
import mediaService from '@/services/media.service';
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

class mediaController {
  constructor() {}

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    const imageUrl = await mediaService.uploadImage(req);

    return res.status(HTTP_STATUS.OK).json({
      data: imageUrl,
      message: 'Upload successfully'
    });
  }

  getStaticImage(req: Request, res: Response, next: NextFunction) {
    const imagePath = path.resolve(UPLOAD_DIR, req.params.filename as string);
    if (!fs.existsSync(imagePath)) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ message: ERROR_MESSAGE.NOT_FOUND });
    }
    return res.sendFile(imagePath);
  }
}

export default new mediaController();
