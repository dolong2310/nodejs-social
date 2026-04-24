import { isValidId } from '@/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/constants/message.constant';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { validate } from '@/presentation/http/utils/validation.util';
import { IUserValidator } from '@/presentation/http/validators/user.validator';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface INotificationValidator {
  listQuery: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  markReadBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  notificationIdParam: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class NotificationsValidator implements INotificationValidator {
  constructor(private readonly userValidator: IUserValidator) {}

  @AutoBind()
  notificationIdParam() {
    return this.userValidator.userIdValidator('notificationId', 'params');
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
