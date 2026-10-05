import type { ChangePasswordPort } from '@/modules/user/application/use-cases/change-password/change-password.port';
import type { GetMePort } from '@/modules/user/application/use-cases/get-me/get-me.port';
import type { GetUserProfilePort } from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.port';
import type { UpdateMePort } from '@/modules/user/application/use-cases/update-me/update-me.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import type { SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ExpressRequest, ValidatedRequest } from '@/presentation/http/express/types';
import type {
  ChangePasswordBodySchema,
  GetUserProfileParamsSchema,
  UpdateMeBodySchema
} from '@/presentation/http/express/v1/schemas/user/user.request.schema';
import type { UserResponse } from '@/presentation/http/express/v1/schemas/user/user.response.schema';

export interface IUserController {
  getMe(req: ExpressRequest): Promise<SuccessResponse<UserResponse>>;
  updateMe(req: ValidatedRequest<{ body: typeof UpdateMeBodySchema }>): Promise<SuccessResponse<UserResponse>>;
  getUserProfile(
    req: ValidatedRequest<{ params: typeof GetUserProfileParamsSchema }>
  ): Promise<SuccessResponse<UserResponse>>;
  changePassword(req: ValidatedRequest<{ body: typeof ChangePasswordBodySchema }>): Promise<SuccessResponse<unknown>>;
}

@AutoBind()
export class UserController extends BaseController implements IUserController {
  constructor(
    private readonly getMeUC: GetMePort,
    private readonly updateMeUC: UpdateMePort,
    private readonly getUserProfileUC: GetUserProfilePort,
    private readonly changePasswordUC: ChangePasswordPort
  ) {
    super();
  }

  async getMe(req: ExpressRequest) {
    const userId = this.getUserId(req);

    const user = await this.getMeUC.execute({ userId });

    return this.response<UserResponse>({
      data: user,
      message: 'Get me successfully'
    });
  }

  async updateMe(req: ValidatedRequest<{ body: typeof UpdateMeBodySchema }>) {
    const userId = this.getUserId(req);
    const body = req.body;

    const updatedUser = await this.updateMeUC.execute({
      userId,
      name: body.name,
      birthday: body.birthday,
      bio: body.bio,
      location: body.location,
      website: body.website,
      username: body.username,
      avatar: body.avatar,
      coverPhoto: body.coverPhoto
    });

    return this.response<UserResponse>({
      data: updatedUser,
      message: 'Update me successfully'
    });
  }

  async getUserProfile(req: ValidatedRequest<{ params: typeof GetUserProfileParamsSchema }>) {
    const { username } = req.params;
    const userId = this.getUserId(req, { optional: true });

    const user = await this.getUserProfileUC.execute({ userId, username });

    return this.response<UserResponse>({
      data: user,
      message: 'Get user profile successfully'
    });
  }

  async changePassword(req: ValidatedRequest<{ body: typeof ChangePasswordBodySchema }>) {
    const userId = this.getUserId(req);

    await this.changePasswordUC.execute({ userId, password: req.body.password });

    return this.response({
      message: 'Change password successfully'
    });
  }
}
