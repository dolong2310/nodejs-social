import { IUsersService } from '@/application/ports/user.port';

import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  GetUserProfileParamsDTO,
  UpdateMeBodyDTO,
  UpdateMeRequestDTO
} from '@/presentation/http/dtos/user/users.request.dto';
import { UserResponseDTO } from '@/presentation/http/dtos/user/users.response.dto';

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IUsersController {
  getMe(req: Request, res: Response): Promise<void>;
  updateMe(req: Request<ParamsDictionary, object, UpdateMeBodyDTO>, res: Response): Promise<void>;
  getUserProfile(req: Request<GetUserProfileParamsDTO>, res: Response): Promise<void>;
}

export class UsersController extends BaseController implements IUsersController {
  constructor(private readonly usersService: IUsersService) {
    super();
  }

  @AutoBind()
  async getMe(req: Request, res: Response) {
    const userId = this.getUserId(req);

    const user = await this.usersService.getMe({ userId });

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

    const updatedUser = await this.usersService.updateMe({
      userId,
      name: dto.name,
      dateOfBirth: dto.dateOfBirth,
      bio: dto.bio,
      location: dto.location,
      website: dto.website,
      username: dto.username,
      avatar: dto.avatar,
      coverPhoto: dto.coverPhoto
    });

    this.sendResponse<UserResponseDTO>({
      res,
      data: updatedUser,
      message: 'Update me successfully'
    });
  }

  @AutoBind()
  async getUserProfile(req: Request<GetUserProfileParamsDTO>, res: Response) {
    const { username } = req.params;
    const userId = this.getUserId(req, { optional: true });

    const user = await this.usersService.getUserProfile({ userId, username });

    this.sendResponse<UserResponseDTO>({
      res,
      data: user,
      message: 'Get user profile successfully'
    });
  }
}
