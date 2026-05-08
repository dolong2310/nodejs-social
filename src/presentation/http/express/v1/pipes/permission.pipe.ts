import { EHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import { MODULE_TAG_REGEX } from '@/modules/common/constants/regex.constants';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { RequestHandlerType } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

const HTTP_METHODS = Object.values(EHttpMethod);

export interface IPermissionsPipe {
  permissionIdParam(): RequestHandlerType;
  createBodyPipe(): RequestHandlerType;
  updateBodyPipe(): RequestHandlerType;
}

export class PermissionsPipe implements IPermissionsPipe {
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
  createBodyPipe() {
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
  updateBodyPipe() {
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
