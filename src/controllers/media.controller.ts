import HTTP_STATUS from '@/constants/httpStatus.constant';
import mediaService from '@/services/media.service';
import { NextFunction, Request, Response } from 'express';

class mediaController {
  constructor() {}

  async uploadImage(req: Request, res: Response, next: NextFunction) {
    const data = await mediaService.uploadImage(req);

    return res.status(HTTP_STATUS.OK).json({
      message: 'Upload image successfully'
    });
  }
}

export default new mediaController();
