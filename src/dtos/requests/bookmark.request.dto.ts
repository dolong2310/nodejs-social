import { ParamsDictionary } from 'express-serve-static-core';

export class CreateBookmarkRequestDTO {
  postId: string;

  constructor(body: { postId: string }) {
    this.postId = body.postId;
  }
}

export interface DeleteBookmarkParamsDTO extends ParamsDictionary {
  postId: string;
}
