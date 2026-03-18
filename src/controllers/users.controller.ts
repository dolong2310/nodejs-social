import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { NotFoundError } from '@/responses/error.response';
import { IGetUserProfileRequestParams, IUpdateMeRequestBody } from '@/models/requests/user.request';
import { OK } from '@/responses/success.response';
import { IUsersService } from '@/services/users.service';
import { TokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

export interface IUsersController {
  getMe(req: Request, res: Response): Promise<void>;
  updateMe(req: Request<{}, {}, IUpdateMeRequestBody>, res: Response): Promise<void>;
  getUserProfile(req: Request<IGetUserProfileRequestParams>, res: Response): Promise<void>;
}

class UsersController extends BaseController implements IUsersController {
  constructor(private readonly usersService: IUsersService) {
    super();
  }

  async getMe(req: Request, res: Response) {
    const { userId } = req.tokenPayload as TokenPayload;

    const user = await this.usersService.getMe(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    new OK({
      data: user,
      message: 'Get me successfully'
    }).send(res);
  }

  async updateMe(req: Request<{}, {}, IUpdateMeRequestBody>, res: Response) {
    const { userId } = req.tokenPayload as TokenPayload;
    const { body } = req;

    const _body = body.dateOfBirth ? { ...body, dateOfBirth: new Date(body.dateOfBirth) } : body;

    const updatedUser = await this.usersService.updateMe(
      userId,
      _body as IUpdateMeRequestBody & { dateOfBirth?: Date }
    );

    new OK({
      data: updatedUser,
      message: 'Update me successfully'
    }).send(res);
  }

  async getUserProfile(req: Request<IGetUserProfileRequestParams>, res: Response) {
    const { username } = req.params;

    const user = await this.usersService.getUserProfile(username);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    new OK({
      data: user,
      message: 'Get user profile successfully'
    }).send(res);
  }
}

export default UsersController;
