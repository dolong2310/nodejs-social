import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { IUserValidator } from '@/presentation/http/validators/user.validator';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export interface IFriendValidator {
  sendRequestToUserIdValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  incomingFromUserIdValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  revokeOutgoingToUserIdValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  unfriendUserIdValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class FriendsValidator implements IFriendValidator {
  constructor(private readonly userValidator: IUserValidator) {}

  @AutoBind()
  sendRequestToUserIdValidator() {
    return this.userValidator.userIdValidator('toUserId', 'body');
  }

  @AutoBind()
  incomingFromUserIdValidator() {
    return this.userValidator.userIdValidator('fromUserId', 'params');
  }

  @AutoBind()
  revokeOutgoingToUserIdValidator() {
    return this.userValidator.userIdValidator('toUserId', 'params');
  }

  @AutoBind()
  unfriendUserIdValidator() {
    return this.userValidator.userIdValidator('userId', 'params');
  }
}
