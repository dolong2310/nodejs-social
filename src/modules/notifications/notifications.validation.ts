import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { IUsersValidation } from '@/modules';
import { isValidMongoId, validate } from '@/utils';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface INotificationsValidation {
  listQuery: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  markReadBody: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  notificationIdParam: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class NotificationsValidation implements INotificationsValidation {
  notificationIdParam!: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;

  listQuery = validate(
    checkSchema(
      {
        limit: { optional: true, isInt: { options: { min: 1, max: 100 } } },
        cursor: { optional: true, isString: true },
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

  constructor(usersValidation: IUsersValidation) {
    this.notificationIdParam = usersValidation.userIdValidation('notificationId', 'params');
  }
}
