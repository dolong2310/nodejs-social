import { isValidId } from '@/modules/core/domain/helpers/ids';
import { ROLE_NAME_PATTERN } from '@/modules/role/domain/entities/role.type';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

export interface IRolesValidator {
  roleIdParam(): RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  createBodyValidator(): RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  updateBodyValidator(): RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class RolesValidator implements IRolesValidator {
  @AutoBind()
  roleIdParam() {
    return validate(
      checkSchema(
        {
          roleId: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.ROLE_ID_IS_REQUIRED },
            isString: true,
            trim: true,
            custom: {
              options: (value: string) => {
                if (!isValidId(value)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.ROLE_ID_INVALID);
                }
                return true;
              }
            }
          }
        },
        ['params']
      )
    );
  }

  @AutoBind()
  createBodyValidator() {
    return validate(
      checkSchema(
        {
          name: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.ROLE_NAME_IS_REQUIRED },
            isString: true,
            trim: true,
            isLength: { options: { min: 1, max: 64 } },
            custom: {
              options: (value: string) => {
                if (!ROLE_NAME_PATTERN.test(value)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.ROLE_NAME_INVALID);
                }
                return true;
              }
            }
          },
          description: { optional: true, isString: true, trim: true },
          isActive: { optional: true, isBoolean: true },
          permissionIds: {
            optional: true,
            isArray: true,
            custom: {
              options: (ids: unknown) => {
                if (!Array.isArray(ids)) return true;
                for (const id of ids) {
                  if (typeof id !== 'string' || !isValidId(id)) {
                    throw new Error(VALIDATION_ERROR_MESSAGE.INVALID_USER_ID);
                  }
                }
                return true;
              }
            }
          }
        },
        ['body']
      )
    );
  }

  @AutoBind()
  updateBodyValidator() {
    return validate(
      checkSchema(
        {
          name: {
            optional: true,
            isString: true,
            trim: true,
            isLength: { options: { min: 1, max: 64 } },
            custom: {
              options: (value: string) => {
                if (!ROLE_NAME_PATTERN.test(value)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.ROLE_NAME_INVALID);
                }
                return true;
              }
            }
          },
          description: { optional: true, isString: true, trim: true },
          isActive: { optional: true, isBoolean: true },
          permissionIds: {
            optional: true,
            isArray: true,
            custom: {
              options: (ids: unknown) => {
                if (!Array.isArray(ids)) return true;
                for (const id of ids) {
                  if (typeof id !== 'string' || !isValidId(id)) {
                    throw new Error(VALIDATION_ERROR_MESSAGE.INVALID_USER_ID);
                  }
                }
                return true;
              }
            }
          }
        },
        ['body']
      )
    );
  }
}
