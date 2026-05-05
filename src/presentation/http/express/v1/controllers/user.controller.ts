import { ChangePasswordInPort } from '@/modules/user/application/use-cases/change-password/change-password.in-port';
import { GetMeInPort } from '@/modules/user/application/use-cases/get-me/get-me.in-port';
import { GetUserProfileInPort } from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.in-port';
import { UpdateMeInPort } from '@/modules/user/application/use-cases/update-me/update-me.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import {
  ChangePasswordRequestDTO,
  GetUserProfileParamsDTO,
  UpdateMeRequestBody,
  UpdateMeRequestDTO
} from '@/presentation/http/express/v1/dtos/user/user.request.dto';
import { ChangePasswordResponseDTO, UserResponseDTO } from '@/presentation/http/express/v1/dtos/user/user.response.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IUserController {
  getMe(req: Request): Promise<unknown>;
  updateMe(req: Request<ParamsDictionary, object, UpdateMeRequestBody>): Promise<unknown>;
  getUserProfile(req: Request<GetUserProfileParamsDTO>): Promise<unknown>;
  changePassword(req: Request<ParamsDictionary, object, ChangePasswordRequestDTO>): Promise<unknown>;
}

export class UserController extends BaseController implements IUserController {
  constructor(
    private readonly getMeUC: GetMeInPort,
    private readonly updateMeUC: UpdateMeInPort,
    private readonly getUserProfileUC: GetUserProfileInPort,
    private readonly changePasswordUC: ChangePasswordInPort
  ) {
    super();
  }

  @AutoBind()
  async getMe(req: Request) {
    const userId = this.getUserId(req);

    const user = await this.getMeUC.execute({ userId });

    return this.response<UserResponseDTO>({
      data: new UserResponseDTO(user),
      message: 'Get me successfully'
    });
  }

  @AutoBind()
  async updateMe(req: Request<ParamsDictionary, object, UpdateMeRequestBody>) {
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
  async getUserProfile(req: Request<GetUserProfileParamsDTO>) {
    const { username } = req.params;
    const userId = this.getUserId(req, { optional: true });

    const user = await this.getUserProfileUC.execute({ userId, username });

    return this.response<UserResponseDTO>({
      data: new UserResponseDTO(user),
      message: 'Get user profile successfully'
    });
  }

  @AutoBind()
  async changePassword(req: Request<ParamsDictionary, object, ChangePasswordRequestDTO>) {
    const dto = new ChangePasswordRequestDTO(req.body);
    const userId = this.getUserId(req);

    await this.changePasswordUC.execute({ userId, password: dto.password });

    return this.response<ChangePasswordResponseDTO>({
      message: 'Change password successfully'
    });
  }
}
