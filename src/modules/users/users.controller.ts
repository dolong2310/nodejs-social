import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import { BlockRepository } from '@/modules/blocks/blocks.repository';
import { GetUserProfileParamsDTO, UpdateMeBodyDTO, UpdateMeRequestDTO } from '@/modules/users/dtos/users.request.dto';
import { UserResponseDTO } from '@/modules/users/dtos/users.response.dto';
import { CannotViewUserProfileBlockedException, UsersUserNotFoundException } from '@/modules/users/users.exception';
import { UsersService } from '@/modules/users/users.service';
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

  @AutoBind()
  async getMe(req: Request, res: Response) {
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
  }

  @AutoBind()
  async updateMe(req: Request<ParamsDictionary, object, UpdateMeBodyDTO>, res: Response) {
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
  }

  @AutoBind()
  async getUserProfile(req: Request<GetUserProfileParamsDTO>, res: Response) {
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
  }
}
