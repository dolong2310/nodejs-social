import { isValidId } from '@/modules/core/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { RequestHandlerType } from '@/presentation/http/express/middlewares/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';
import { checkSchema } from 'express-validator';

export interface INotificationValidator {
  listQuery: RequestHandlerType;
  markReadBody: RequestHandlerType;
  notificationIdParam: RequestHandlerType;
}

export class NotificationsValidator implements INotificationValidator {
  readonly notificationIdParam: RequestHandlerType;

  constructor(private readonly userValidator: IUserValidator) {
    this.notificationIdParam = this.userValidator.userIdValidator('notificationId', 'params');
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
