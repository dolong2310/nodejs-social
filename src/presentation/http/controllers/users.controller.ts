import { ChangePasswordInPort } from '@/application/use-cases/user/change-password/change-password.in-port';
import { GetMeInPort } from '@/application/use-cases/user/get-me/get-me.in-port';
import { GetUserProfileInPort } from '@/application/use-cases/user/get-user-profile/get-user-profile.in-port';
import { UpdateMeInPort } from '@/application/use-cases/user/update-me/update-me.in-port';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  ChangePasswordRequestDTO,
  GetUserProfileParamsDTO,
  UpdateMeRequestBody,
  UpdateMeRequestDTO
} from '@/presentation/http/dtos/user/user.request.dto';
import { ChangePasswordResponseDTO, UserResponseDTO } from '@/presentation/http/dtos/user/user.response.dto';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IUserController {
  getMe(req: Request, res: Response): Promise<void>;
  updateMe(req: Request<ParamsDictionary, object, UpdateMeRequestBody>, res: Response): Promise<void>;
  getUserProfile(req: Request<GetUserProfileParamsDTO>, res: Response): Promise<void>;
  changePassword(req: Request<ParamsDictionary, object, ChangePasswordRequestDTO>, res: Response): Promise<void>;
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
  async getMe(req: Request, res: Response) {
    const userId = this.getUserId(req);

    const user = await this.getMeUC.execute({ userId });

    this.sendResponse<UserResponseDTO>({
      res,
      data: new UserResponseDTO(user),
      message: 'Get me successfully'
    });
  }

  @AutoBind()
  async updateMe(req: Request<ParamsDictionary, object, UpdateMeRequestBody>, res: Response) {
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

    this.sendResponse<UserResponseDTO>({
      res,
      data: new UserResponseDTO(updatedUser),
      message: 'Update me successfully'
    });
  }

  @AutoBind()
  async getUserProfile(req: Request<GetUserProfileParamsDTO>, res: Response) {
    const { username } = req.params;
    const userId = this.getUserId(req, { optional: true });

    const user = await this.getUserProfileUC.execute({ userId, username });

    this.sendResponse<UserResponseDTO>({
      res,
      data: new UserResponseDTO(user),
      message: 'Get user profile successfully'
    });
  }

  @AutoBind()
  async changePassword(req: Request<ParamsDictionary, object, ChangePasswordRequestDTO>, res: Response) {
    const dto = new ChangePasswordRequestDTO(req.body);
    const userId = this.getUserId(req);

    await this.changePasswordUC.execute({ userId, password: dto.password });

    this.sendResponse<ChangePasswordResponseDTO>({
      res,
      message: 'Change password successfully'
    });
  }
}
