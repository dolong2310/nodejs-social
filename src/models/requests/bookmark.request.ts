import { ParamsDictionary } from 'express-serve-static-core';

export interface ICreateBookmarkRequestBody {
  postId: string;
}

export interface IDeleteBookmarkRequestParams extends ParamsDictionary {
  postId: string;
}
