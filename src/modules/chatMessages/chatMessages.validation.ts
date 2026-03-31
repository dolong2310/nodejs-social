import { AutoBind, Injectable } from '@/decorators';
import { validate } from '@/utils';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface IChatMessagesValidation {
  sendMessageBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  markReadBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

@Injectable()
export class ChatMessagesValidation implements IChatMessagesValidation {
  @AutoBind()
  sendMessageBody() {
    return validate(
      checkSchema(
        {
          text: { optional: true, isString: true, trim: true },
          attachments: { optional: true, isArray: true }
        },
        ['body']
      )
    );
  }

  @AutoBind()
  markReadBody() {
    return validate(
      checkSchema(
        {
          lastReadMessageId: { optional: true, isString: true, trim: true }
        },
        ['body']
      )
    );
  }
}
