import { isValidId } from '@/modules/core/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { RequestHandlerType } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { checkSchema } from 'express-validator';

export interface INotificationPipe {
  listQuery: RequestHandlerType;
  markReadBody: RequestHandlerType;
  notificationIdParam: RequestHandlerType;
}

export class NotificationsPipe implements INotificationPipe {
  readonly notificationIdParam: RequestHandlerType;

  constructor(private readonly userPipe: IUserPipe) {
    this.notificationIdParam = this.userPipe.userIdPipe('notificationId', 'params');
  }

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
