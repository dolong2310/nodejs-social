import { RoleServicePort } from '@/modules/role/application/services/role.service';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { EUserStatus } from '@/modules/user/domain/entities/user.type';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { UserIsBannedException, UserIsInactiveException } from '@/presentation/http/express/exceptions/user.exception';
import { BaseGuard } from '@/presentation/http/express/guards/base.guard';
import { ForbiddenError } from '@/presentation/http/express/responses/error.response';
import { Request } from 'express';

export class AdminGuard extends BaseGuard {
  constructor(
    private readonly roleService: RoleServicePort,
    private readonly userService: UserServicePort
  ) {
    super();
  }

  protected override async canActivate(request: Request): Promise<boolean> {
    const userId = request.tokenPayload?.userId;
    if (!userId) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.ADMIN_ROLE_REQUIRED);
    }
    const [adminRoleId, user] = await Promise.all([
      this.roleService.getAdminRoleId(),
      this.userService.findUserById(userId, { querySafe: false })
    ]);
    if (!user || user.roleId !== adminRoleId) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.ADMIN_ROLE_REQUIRED);
    }
    if (user.status === EUserStatus.INACTIVE) {
      throw UserIsInactiveException;
    }
    if (user.status === EUserStatus.BANNED) {
      throw UserIsBannedException;
    }
    return true;
  }
}
