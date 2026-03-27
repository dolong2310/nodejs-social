import { ParamsDictionary } from 'express-serve-static-core';

export class BlockUserBodyDTO {
  userId: string;

  constructor(body: { userId: string }) {
    this.userId = body.userId;
  }
}

export interface UnblockUserParamsDTO extends ParamsDictionary {
  userId: string;
}
