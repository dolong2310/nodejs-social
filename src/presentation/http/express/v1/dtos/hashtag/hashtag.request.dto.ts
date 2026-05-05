import { ParamsDictionary } from 'express-serve-static-core';

export class CreateHashtagBodyDTO {
  name: string;

  constructor(body: { name: string }) {
    this.name = body.name;
  }
}

export class UpdateHashtagBodyDTO {
  name?: string;

  constructor(body: { name?: string }) {
    this.name = body.name;
  }
}

export interface HashtagIdParamsDTO extends ParamsDictionary {
  hashtagId: string;
}
