import { isValidId } from '@/modules/core/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import type { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

export interface INotificationPipe {
  listQuery: ExpressRequestHandler;
  markReadBody: ExpressRequestHandler;
  notificationIdParam: ExpressRequestHandler;
}

export class NotificationsPipe implements INotificationPipe {
  notificationIdParam = validate(
    checkSchema(
      {
        notificationId: {
          notEmpty: {
            errorMessage: VALIDATION_ERROR_MESSAGE.NOTIFICATION_ID_IS_REQUIRED
          },
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.NOTIFICATION_ID_MUST_BE_A_STRING
          },
          trim: true,
          custom: {
            options: (id: string) => isValidId(id),
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_NOTIFICATION_ID
          }
        }
      },
      ['params']
    )
  );

  listQuery = validate(
    checkSchema(
      {
        unreadOnly: { optional: true, isIn: { options: [['true', 'false', '1', '0']] } }
      },
      ['query']
    )
  );

  markReadBody = validate(
    checkSchema(
      {
        ids: { optional: true, isArray: true },
        'ids.*': {
          isString: true,
          trim: true,
          custom: {
            options: (id: string) => isValidId(id),
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_USER_ID
          }
        }
      },
      ['body']
    )
  );
}
