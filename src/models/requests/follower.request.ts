import { ParamsDictionary } from 'express-serve-static-core';

export interface IFollowUserRequestBody {
  userId: string;
}

export interface IUnfollowUserRequestParams extends ParamsDictionary {
  userId: string;
}
