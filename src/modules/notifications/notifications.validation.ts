import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { AutoBind, Injectable } from '@/decorators';
import { UsersValidation } from '@/modules';
import { isValidMongoId, validate } from '@/utils';
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

  @AutoBind()
  listQuery() {
    return validate(
      checkSchema(
        {
          unreadOnly: { optional: true, isIn: { options: [['true', 'false', '1', '0']] } }
        },
        ['query']
      )
    );
  }

  @AutoBind()
  markReadBody() {
    return validate(
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
}
