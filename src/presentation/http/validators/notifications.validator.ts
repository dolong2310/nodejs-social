import { VALIDATION_ERROR_MESSAGE } from '@/application/common/constants/message.constant';

import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { isValidMongoId } from '@/presentation/http/utils/valid-id.util';
import { validate } from '@/presentation/http/utils/validation.util';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface INotificationsValidation {
  listQuery: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  markReadBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  notificationIdParam: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class NotificationsValidation implements INotificationsValidation {
  constructor(private readonly usersValidation: IUsersValidation) {}

  @AutoBind()
  notificationIdParam() {
    return this.usersValidation.userIdValidation('notificationId', 'params');
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
            options: (id: string) => isValidMongoId(id),
            errorMessage: VALIDATION_ERROR_MESSAGE.INVALID_USER_ID
          }
        }
      },
      ['body']
    )
  );
}
