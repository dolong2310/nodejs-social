import { ParamsDictionary } from 'express-serve-static-core';

export interface IFollowUserRequestBody {
  followedUserId: string;
}

export interface IUnfollowUserRequestParams extends ParamsDictionary {
  userId: string;
}
