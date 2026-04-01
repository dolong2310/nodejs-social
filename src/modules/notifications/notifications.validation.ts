import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { AutoBind } from '@/decorators/autoBind.decorator';
import { Injectable } from '@/decorators/injectable.decorator';
import { UsersValidation } from '@/modules/users/users.validation';
import { isValidMongoId } from '@/utils/common.util';
import { validate } from '@/utils/validation.util';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface INotificationsValidation {
  listQuery: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  markReadBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  notificationIdParam: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

@Injectable()
export class NotificationsValidation implements INotificationsValidation {
  constructor(private readonly usersValidation: UsersValidation) {}

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
