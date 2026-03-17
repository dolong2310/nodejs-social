import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ErrorWithStatus } from '@/models/error.model';
import { IGetUserProfileRequestParams, IUpdateMeRequestBody } from '@/models/requests/user.request';
import usersService from '@/services/users.service';
import { AccessTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class UserController {
  constructor() {}

  async getMe(req: Request, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;

    const user = await usersService.getMe(userId);

    if (!user) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      data: user,
      message: 'Get me successfully'
    });
  }

  async updateMe(req: Request<{}, {}, IUpdateMeRequestBody>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { body } = req;

    const _body = body.dateOfBirth ? { ...body, dateOfBirth: new Date(body.dateOfBirth) } : body;

    const updatedUser = await usersService.updateMe(userId, _body as IUpdateMeRequestBody & { dateOfBirth?: Date });

    return res.status(HTTP_STATUS.OK).json({
      data: updatedUser,
      message: 'Update me successfully'
    });
  }

  async getUserProfile(req: Request<IGetUserProfileRequestParams>, res: Response) {
    const { username } = req.params;

    const user = await usersService.getUserProfile(username);

    if (!user) {
      throw new ErrorWithStatus({
        message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      data: user,
      message: 'Get user profile successfully'
    });
  }
}

export default new UserController();
