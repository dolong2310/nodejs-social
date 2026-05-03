import { MODULE_TAG_REGEX } from '@/modules/common/constants/regex.constants';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { EHttpMethod } from '@/modules/permission/domain/entities/permission.type';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema } from 'express-validator';

const HTTP_METHODS = Object.values(EHttpMethod);

export interface IPermissionsValidator {
  permissionIdParam(): RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  createBodyValidator(): RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  updateBodyValidator(): RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class PermissionsValidator implements IPermissionsValidator {
  @AutoBind()
  permissionIdParam() {
    return validate(
      checkSchema(
        {
          permissionId: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.PERMISSION_ID_IS_REQUIRED },
            isString: true,
            trim: true,
            custom: {
              options: (value: string) => {
                if (!isValidId(value)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.PERMISSION_ID_INVALID);
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
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.PERMISSION_NAME_IS_REQUIRED },
            isString: true,
            trim: true,
            isLength: { options: { min: 1, max: 128 } }
          },
          description: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.PERMISSION_DESCRIPTION_IS_REQUIRED },
            isString: true,
            trim: true
          },
          path: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.PERMISSION_PATH_IS_REQUIRED },
            isString: true,
            trim: true,
            custom: {
              options: (value: string) => {
                if (!value.startsWith('/')) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.PERMISSION_PATH_INVALID);
                }
                return true;
              }
            }
          },
          method: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.PERMISSION_METHOD_IS_REQUIRED },
            isString: true,
            trim: true,
            custom: {
              options: (value: string) => {
                if (!HTTP_METHODS.includes(value as EHttpMethod)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.PERMISSION_METHOD_INVALID);
                }
                return true;
              }
            }
          },
          module: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.PERMISSION_MODULE_IS_REQUIRED },
            isString: true,
            trim: true,
            custom: {
              options: (value: string) => {
                if (!MODULE_TAG_REGEX.test(value)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.PERMISSION_MODULE_INVALID);
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
          name: { optional: true, isString: true, trim: true, isLength: { options: { min: 1, max: 128 } } },
          description: { optional: true, isString: true, trim: true },
          path: {
            optional: true,
            isString: true,
            trim: true,
            custom: {
              options: (value: string) => {
                if (!value.startsWith('/')) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.PERMISSION_PATH_INVALID);
                }
                return true;
              }
            }
          },
          method: {
            optional: true,
            isString: true,
            trim: true,
            custom: {
              options: (value: string) => {
                if (!HTTP_METHODS.includes(value as EHttpMethod)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.PERMISSION_METHOD_INVALID);
                }
                return true;
              }
            }
          },
          module: {
            optional: true,
            isString: true,
            trim: true,
            custom: {
              options: (value: string) => {
                if (!MODULE_TAG_REGEX.test(value)) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.PERMISSION_MODULE_INVALID);
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
