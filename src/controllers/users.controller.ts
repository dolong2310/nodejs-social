import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { NotFoundError } from '@/models/error.response';
import { IGetUserProfileRequestParams, IUpdateMeRequestBody } from '@/models/requests/user.request';
import { OK } from '@/models/success.response';
import usersService from '@/services/users.service';
import { AccessTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class UserController {
  constructor() {}

  async getMe(req: Request, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;

    const user = await usersService.getMe(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    return new OK({
      data: user,
      message: 'Get me successfully'
    }).send(res);
  }

  async updateMe(req: Request<{}, {}, IUpdateMeRequestBody>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { body } = req;

    const _body = body.dateOfBirth ? { ...body, dateOfBirth: new Date(body.dateOfBirth) } : body;

    const updatedUser = await usersService.updateMe(userId, _body as IUpdateMeRequestBody & { dateOfBirth?: Date });

    return new OK({
      data: updatedUser,
      message: 'Update me successfully'
    }).send(res);
  }

  async getUserProfile(req: Request<IGetUserProfileRequestParams>, res: Response) {
    const { username } = req.params;

    const user = await usersService.getUserProfile(username);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    return new OK({
      data: user,
      message: 'Get user profile successfully'
    }).send(res);
  }
}

export default new UserController();
