'use strict';

import { HTTP_ERROR_MESSAGE } from '@/constants/httpMessage.constant';
import { HTTP_STATUS } from '@/constants/httpStatus.constant';
import { Response } from 'express';

interface SuccessResponseParams {
  message?: string;
  statusCode?: number;
  reasonPhrasesCode?: string;
  data?: any;
}

export class SuccessResponse {
  message: string;
  statusCode: number;
  data: any;

  constructor({
    message,
    statusCode = HTTP_STATUS.OK,
    reasonPhrasesCode = HTTP_ERROR_MESSAGE.OK,
    data = {}
  }: SuccessResponseParams) {
    this.message = message || reasonPhrasesCode;
    this.statusCode = statusCode;
    this.data = data;
  }

  send(res: Response, header: Record<string, string> = {}): Response {
    return res.status(this.statusCode).json(this);
  }
}

export class OK extends SuccessResponse {
  constructor(params: SuccessResponseParams) {
    super({
      ...params,
      statusCode: params.statusCode || HTTP_STATUS.OK,
      reasonPhrasesCode: params.reasonPhrasesCode || HTTP_ERROR_MESSAGE.OK
    });
  }
}

export class Created extends SuccessResponse {
  constructor(params: SuccessResponseParams) {
    super({
      ...params,
      statusCode: params.statusCode || HTTP_STATUS.CREATED,
      reasonPhrasesCode: params.reasonPhrasesCode || HTTP_ERROR_MESSAGE.CREATED
    });
  }
}
