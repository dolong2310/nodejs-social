import { Injectable } from '@/decorators';
import {
  BaseController,
  BlockRepository,
  CannotViewUserProfileBlockedException,
  GetUserProfileParamsDTO,
  UpdateMeBodyDTO,
  UpdateMeRequestDTO,
  UserResponseDTO,
  UsersService,
  UsersUserNotFoundException
} from '@/modules';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IUsersController {
  getMe(req: Request, res: Response): Promise<void>;
  updateMe(req: Request<ParamsDictionary, object, UpdateMeBodyDTO>, res: Response): Promise<void>;
  getUserProfile(req: Request<GetUserProfileParamsDTO>, res: Response): Promise<void>;
}

@Injectable()
export class UsersController extends BaseController implements IUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly blockRepository: BlockRepository
  ) {
    super();
  }

  getMe = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);

    const user = await this.usersService.getMe(userId);

    if (!user) {
      throw UsersUserNotFoundException;
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
      throw UsersUserNotFoundException;
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
      throw UsersUserNotFoundException;
    }

    const viewerId = this.getUserId(req, { optional: true });
    if (viewerId) {
      const blocked = await this.blockRepository.isBlockedEitherWay(viewerId, user._id);
      if (blocked) {
        throw CannotViewUserProfileBlockedException;
      }
    }

    this.sendResponse<UserResponseDTO>({
      res,
      data: user,
      message: 'Get user profile successfully'
    });
  };
}
