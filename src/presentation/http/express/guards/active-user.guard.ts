import requestContextLogger from '@/infrastructure/logger/request-context-logger';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.type';
import { BaseGuard } from '@/presentation/http/express/core/base.guard';
import {
  MissingAuthTokenPayloadException,
  UserIsBannedException,
  UserIsInactiveException,
  UserNotFoundException
} from '@/presentation/http/express/exceptions/user.exception';
import { Request } from 'express';

export class ActiveUserGuard implements BaseGuard {
  constructor(private readonly userService: UserServicePort) {}

  async canActivate(request: Request): Promise<boolean> {
    const userId: string | undefined = request.tokenPayload?.userId;
    if (!userId) {
      throw MissingAuthTokenPayloadException;
    }

    const user = await this.userService.findUserById(userId, { querySafe: true });
    if (!user) {
      throw UserNotFoundException;
    }

    if (user.status === EnumUserStatus.INACTIVE) {
      throw UserIsInactiveException;
    }

    if (user.status === EnumUserStatus.BANNED) {
      throw UserIsBannedException;
    }

    request.user = user;
    requestContextLogger.syncLogContextFromUser(request);

    return true;
  }
}
