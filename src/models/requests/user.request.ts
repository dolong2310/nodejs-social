import { ParamsDictionary } from 'express-serve-static-core';

export interface IUpdateMeRequestBody {
  name?: string;
  dateOfBirth?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
}

export interface IGetUserProfileRequestParams extends ParamsDictionary {
  username: string;
}
