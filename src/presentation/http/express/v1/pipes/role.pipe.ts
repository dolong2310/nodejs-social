import { ROLE_NAME_REGEX } from '@/modules/common/constants/regex.constants';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

export interface IRolesPipe {
  roleIdParam(): ExpressRequestHandler;
  createBodyPipe(): ExpressRequestHandler;
  updateBodyPipe(): ExpressRequestHandler;
}

export class RolesPipe implements IRolesPipe {
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
  createBodyPipe() {
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
                if (!ROLE_NAME_REGEX.test(value)) {
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
  updateBodyPipe() {
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
                if (!ROLE_NAME_REGEX.test(value)) {
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
