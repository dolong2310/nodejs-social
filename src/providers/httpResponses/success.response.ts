'use strict';

import { HTTP_ERROR_MESSAGE, HTTP_STATUS } from '@/constants';
import { Response } from 'express';

export interface SuccessResponseParams<T> {
  message?: string;
  statusCode?: number;
  reasonPhrasesCode?: string;
  data?: T;
}

export class SuccessResponse<T> {
  message: string;
  statusCode: number;
  data: T;

  constructor({
    message,
    statusCode = HTTP_STATUS.OK,
    reasonPhrasesCode = HTTP_ERROR_MESSAGE.OK,
    data = {} as T
  }: SuccessResponseParams<T>) {
    this.message = message || reasonPhrasesCode;
    this.statusCode = statusCode;
    this.data = data;
  }

  send(res: Response): Response {
    return res.status(this.statusCode).json(this);
  }
}

export class OK<T> extends SuccessResponse<T> {
  constructor(params: SuccessResponseParams<T>) {
    super({
      ...params,
      statusCode: params.statusCode || HTTP_STATUS.OK,
      reasonPhrasesCode: params.reasonPhrasesCode || HTTP_ERROR_MESSAGE.OK
    });
  }
}

export class Created<T> extends SuccessResponse<T> {
  constructor(params: SuccessResponseParams<T>) {
    super({
      ...params,
      statusCode: params.statusCode || HTTP_STATUS.CREATED,
      reasonPhrasesCode: params.reasonPhrasesCode || HTTP_ERROR_MESSAGE.CREATED
    });
  }
}
