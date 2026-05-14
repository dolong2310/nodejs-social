import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

export interface IChatMessagePipe {
  sendMessageBody: ExpressRequestHandler;
  markReadBody: ExpressRequestHandler;
}

export class ChatMessagesPipe implements IChatMessagePipe {
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
