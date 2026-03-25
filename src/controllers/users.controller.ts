import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { GetUserProfileParamsDTO, UpdateMeBodyDTO, UpdateMeRequestDTO } from '@/dtos/requests/user.request.dto';
import { UserResponseDTO } from '@/dtos/responses/user.response.dto';
import { IBlockRepository } from '@/repositories/block.repository';
import { ForbiddenError, NotFoundError } from '@/responses/error.response';
import { IUsersService } from '@/services/users.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';

export interface IUsersController {
  getMe(req: Request, res: Response): Promise<void>;
  updateMe(req: Request<ParamsDictionary, object, UpdateMeBodyDTO>, res: Response): Promise<void>;
  getUserProfile(req: Request<GetUserProfileParamsDTO>, res: Response): Promise<void>;
}

class UsersController extends BaseController implements IUsersController {
  constructor(
    private readonly usersService: IUsersService,
    private readonly blockRepository: IBlockRepository
  ) {
    super();
  }

  getMe = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);

    const user = await this.usersService.getMe(userId);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    this.sendResponse<UserResponseDTO>({
      res,
      data: user,
      message: 'Get me successfully'
    });
  };

  updateMe = async (req: Request<ParamsDictionary, object, UpdateMeBodyDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const dto = new UpdateMeRequestDTO(req.body);

    const updatedUser = await this.usersService.updateMe(userId, this.sanitize(dto));

    if (!updatedUser) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    this.sendResponse<UserResponseDTO>({
      res,
      data: updatedUser,
      message: 'Update me successfully'
    });
  };

  getUserProfile = async (req: Request<GetUserProfileParamsDTO>, res: Response) => {
    const { username } = req.params;

    const user = await this.usersService.getUserProfile(username);

    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    const viewerId = this.getUserId(req, { optional: true });
    if (viewerId) {
      const blocked = await this.blockRepository.isBlockedEitherWay(new ObjectId(viewerId), new ObjectId(user._id));
      if (blocked) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CANNOT_VIEW_USER_PROFILE_BLOCKED);
      }
    }

    this.sendResponse<UserResponseDTO>({
      res,
      data: user,
      message: 'Get user profile successfully'
    });
  };
}

export default UsersController;
