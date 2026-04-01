import { Injectable } from '@/decorators/injectable.decorator';
import { validate } from '@/utils/validation.util';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface IChatMessagesValidation {
  sendMessageBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  markReadBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

@Injectable()
export class ChatMessagesValidation implements IChatMessagesValidation {
  sendMessageBody = validate(
    checkSchema(
      {
        text: { optional: true, isString: true, trim: true },
        attachments: { optional: true, isArray: true }
      },
      ['body']
    )
  );

  markReadBody = validate(
    checkSchema(
      {
        lastReadMessageId: { optional: true, isString: true, trim: true }
      },
      ['body']
    )
  );
}
