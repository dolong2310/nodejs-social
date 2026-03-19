import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { IGetUserProfileRequestParams, IUpdateMeRequestBody } from '@/models/requests/user.request';
import { IUserResponse } from '@/models/responses/user.response';
import { NotFoundError } from '@/responses/error.response';
import { IUsersService } from '@/services/users.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IUsersController {
  getMe(req: Request, res: Response): Promise<void>;
  updateMe(req: Request<ParamsDictionary, object, IUpdateMeRequestBody>, res: Response): Promise<void>;
  getUserProfile(req: Request<IGetUserProfileRequestParams>, res: Response): Promise<void>;
}

class UsersController extends BaseController implements IUsersController {
  constructor(private readonly usersService: IUsersService) {
    super();
  }

  getMe = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);

    const user = await this.usersService.getMe(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    this.sendResponse<IUserResponse>({
      res,
      data: user,
      message: 'Get me successfully'
    });
  };

  updateMe = async (req: Request<ParamsDictionary, object, IUpdateMeRequestBody>, res: Response) => {
    const userId = this.getUserId(req);
    const { body } = req;

    const _body = body.dateOfBirth ? { ...body, dateOfBirth: new Date(body.dateOfBirth) } : body;

    const updatedUser = await this.usersService.updateMe(
      userId,
      _body as IUpdateMeRequestBody & { dateOfBirth?: Date }
    );

    if (!updatedUser) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    this.sendResponse<IUserResponse>({
      res,
      data: updatedUser,
      message: 'Update me successfully'
    });
  };

  getUserProfile = async (req: Request<IGetUserProfileRequestParams>, res: Response) => {
    const { username } = req.params;

    const user = await this.usersService.getUserProfile(username);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    this.sendResponse<IUserResponse>({
      res,
      data: user,
      message: 'Get user profile successfully'
    });
  };
}

export default UsersController;
