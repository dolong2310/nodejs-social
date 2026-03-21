import { ParamsDictionary } from 'express-serve-static-core';

export class SendFriendRequestBodyDTO {
  toUserId: string;

  constructor(body: { toUserId: string }) {
    this.toUserId = body.toUserId;
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
