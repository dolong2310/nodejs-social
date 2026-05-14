import { ChangePasswordPort } from '@/modules/user/application/use-cases/change-password/change-password.port';
import { GetMePort } from '@/modules/user/application/use-cases/get-me/get-me.port';
import { GetUserProfilePort } from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.port';
import { UpdateMePort } from '@/modules/user/application/use-cases/update-me/update-me.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { SuccessResponse } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import {
  ChangePasswordRequestDTO,
  GetUserProfileParamsDTO,
  UpdateMeRequestBody,
  UpdateMeRequestDTO
} from '@/presentation/http/express/v1/dtos/user/user.request.dto';
import { ChangePasswordResponseDTO, UserResponseDTO } from '@/presentation/http/express/v1/dtos/user/user.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IUserController {
  getMe(req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<SuccessResponse<UserResponseDTO>>;
  updateMe(
    req: ExpressRequest<ParamsDictionary, object, UpdateMeRequestBody>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<UserResponseDTO>>;
  getUserProfile(
    req: ExpressRequest<GetUserProfileParamsDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<UserResponseDTO>>;
  changePassword(
    req: ExpressRequest<ParamsDictionary, object, ChangePasswordRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<ChangePasswordResponseDTO>>;
}

export class UserController extends BaseController implements IUserController {
  constructor(
    private readonly getMeUC: GetMePort,
    private readonly updateMeUC: UpdateMePort,
    private readonly getUserProfileUC: GetUserProfilePort,
    private readonly changePasswordUC: ChangePasswordPort
  ) {
    super();
  }

  @AutoBind()
  async getMe(req: ExpressRequest) {
    const userId = this.getUserId(req);

    const user = await this.getMeUC.execute({ userId });

    return this.response<UserResponseDTO>({
      data: new UserResponseDTO(user),
      message: 'Get me successfully'
    });
  }

  @AutoBind()
  async updateMe(req: ExpressRequest<ParamsDictionary, object, UpdateMeRequestBody>) {
    const userId = this.getUserId(req);
    const dto = new UpdateMeRequestDTO(req.body);

    const updatedUser = await this.updateMeUC.execute({
      userId,
      name: dto.name,
      birthday: dto.birthday,
      bio: dto.bio,
      location: dto.location,
      website: dto.website,
      username: dto.username,
      avatar: dto.avatar,
      coverPhoto: dto.coverPhoto
    });

    return this.response<UserResponseDTO>({
      data: new UserResponseDTO(updatedUser),
      message: 'Update me successfully'
    });
  }

  @AutoBind()
  async getUserProfile(req: ExpressRequest<GetUserProfileParamsDTO>) {
    const { username } = req.params;
    const userId = this.getUserId(req, { optional: true });

    const user = await this.getUserProfileUC.execute({ userId, username });

    return this.response<UserResponseDTO>({
      data: new UserResponseDTO(user),
      message: 'Get user profile successfully'
    });
  }

  @AutoBind()
  async changePassword(req: ExpressRequest<ParamsDictionary, object, ChangePasswordRequestDTO>) {
    const dto = new ChangePasswordRequestDTO(req.body);
    const userId = this.getUserId(req);

    await this.changePasswordUC.execute({ userId, password: dto.password });

    return this.response<ChangePasswordResponseDTO>({
      message: 'Change password successfully'
    });
  }
}
