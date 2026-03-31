import { IUsersValidation } from '@/modules';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';

export interface IFriendsValidation {
  sendRequestToUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  incomingFromUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  revokeOutgoingToUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  unfriendUserIdValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class FriendsValidation implements IFriendsValidation {
  constructor(private readonly usersValidation: IUsersValidation) {}

  sendRequestToUserIdValidation = () => this.usersValidation.userIdValidation('toUserId', 'body');
  incomingFromUserIdValidation = () => this.usersValidation.userIdValidation('fromUserId', 'params');
  revokeOutgoingToUserIdValidation = () => this.usersValidation.userIdValidation('toUserId', 'params');
  unfriendUserIdValidation = () => this.usersValidation.userIdValidation('userId', 'params');
}
