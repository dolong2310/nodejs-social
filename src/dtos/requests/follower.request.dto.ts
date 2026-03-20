import { ParamsDictionary } from 'express-serve-static-core';

export class FollowUserRequestDTO {
  userId: string;

  constructor(body: { userId: string }) {
    this.userId = body.userId;
  }
}

export interface UnfollowUserParamsDTO extends ParamsDictionary {
  userId: string;
}
