import { Username } from '@/modules/common/domain/value-objects/username.value-object';
import type { ParamsDictionary } from 'express-serve-static-core';

export class SendFriendRequestBodyDTO {
  username: string;

  constructor(body: { username: string }) {
    this.username = Username.normalize(body.username) ?? '';
  }
}

export interface AcceptDeclineRequestParamsDTO extends ParamsDictionary {
  fromUserId: string;
}

export interface RevokeOutgoingRequestParamsDTO extends ParamsDictionary {
  toUserId: string;
}

export interface UnfriendParamsDTO extends ParamsDictionary {
  userId: string;
}
