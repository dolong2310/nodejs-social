import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import { GetUserProfileParamsDTO, UpdateMeBodyDTO, UpdateMeRequestDTO } from '@/modules/users/dtos/users.request.dto';
import { UserResponseDTO } from '@/modules/users/dtos/users.response.dto';
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
  constructor(private readonly usersService: UsersService) {
    super();
  }

  @AutoBind()
  async getMe(req: Request, res: Response) {
    const userId = this.getUserId(req);

    const user = await this.usersService.getMe(userId);

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
