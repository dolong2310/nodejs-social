import { AutoBind } from '@/decorators/autoBind.decorator';
import { Injectable } from '@/decorators/injectable.decorator';
import { UsersValidation } from '@/modules/users/users.validation';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export interface IFriendsValidation {
  sendRequestToUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  incomingFromUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  revokeOutgoingToUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  unfriendUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

@Injectable()
export class FriendsValidation implements IFriendsValidation {
  constructor(private readonly usersValidation: UsersValidation) {}

  @AutoBind()
  sendRequestToUserIdValidation() {
    return this.usersValidation.userIdValidation('toUserId', 'body');
  }

  @AutoBind()
  incomingFromUserIdValidation() {
    return this.usersValidation.userIdValidation('fromUserId', 'params');
  }

  @AutoBind()
  revokeOutgoingToUserIdValidation() {
    return this.usersValidation.userIdValidation('toUserId', 'params');
  }

  @AutoBind()
  unfriendUserIdValidation() {
    return this.usersValidation.userIdValidation('userId', 'params');
  }
}
