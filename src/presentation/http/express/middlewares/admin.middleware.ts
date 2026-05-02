import { IRoleService } from '@/modules/role/application/services/role.service';
import { IUserService } from '@/modules/user/application/services/user.service';
import { EUserStatus } from '@/modules/user/domain/entities/user.type';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { UserIsBannedException, UserIsInactiveException } from '@/presentation/http/express/exceptions/user.exception';
import { ForbiddenError } from '@/presentation/http/express/responses/error.response';
import { NextFunction, Request, Response } from 'express';

const adminOnlyError = new ForbiddenError(VALIDATION_ERROR_MESSAGE.ADMIN_ROLE_REQUIRED);

/**
 * Sau `protect` — chỉ user có `roleId` trùng role ADMIN mới qua.
 */
export function requireAdmin(roleService: IRoleService, userService: IUserService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const userId = req.tokenPayload?.userId;
    if (!userId) {
      next(adminOnlyError);
      return;
    }
    try {
      const [adminRoleId, user] = await Promise.all([
        roleService.getAdminRoleId(),
        userService.findUserById(userId, { querySafe: false })
      ]);
      if (!user || user.roleId !== adminRoleId) {
        next(adminOnlyError);
        return;
      }
      if (user.status === EUserStatus.INACTIVE) {
        next(UserIsInactiveException);
        return;
      }
      if (user.status === EUserStatus.BANNED) {
        next(UserIsBannedException);
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
