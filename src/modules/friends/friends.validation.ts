import { AutoBind, Injectable } from '@/decorators';
import { UsersValidation } from '@/modules';
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
