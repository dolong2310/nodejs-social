import { ParamsDictionary } from 'express-serve-static-core';

export class CreateLikeRequestDTO {
  postId: string;

  constructor(body: { postId: string }) {
    this.postId = body.postId;
  }
}

export interface DeleteLikeParamsDTO extends ParamsDictionary {
  postId: string;
}
