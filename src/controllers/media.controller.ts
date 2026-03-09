import HTTP_STATUS from '@/constants/httpStatus.constant';
import mediaService from '@/services/media.service';
import { NextFunction, Request, Response } from 'express';

class mediaController {
  constructor() {}

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    const imageUrl = await mediaService.uploadImage(req);

    return res.status(HTTP_STATUS.OK).json({
      data: imageUrl
    });
  }
}

export default new mediaController();
