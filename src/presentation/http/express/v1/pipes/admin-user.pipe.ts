import { USERNAME_REGEX } from '@/modules/common/constants/regex.constants';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.type';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { ConfirmPasswordMustMatchException } from '@/presentation/http/express/exceptions/auth.exception';
import {
  InvalidUserIdException,
  UsernameFormatInvalidException
} from '@/presentation/http/express/exceptions/user.exception';
import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { confirmPasswordSchema, passwordSchema } from '@/presentation/http/express/v1/pipes/auth.pipe';
import { birthdaySchema, imageSchema, nameSchema } from '@/presentation/http/express/v1/pipes/user.pipe';
import { checkSchema, ParamSchema } from 'express-validator';

const emailSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.EMAIL_IS_REQUIRED
  },
  isEmail: {
    errorMessage: VALIDATION_ERROR_MESSAGE.EMAIL_IS_INVALID
  },
  trim: true
};

const roleIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.ROLE_ID_IS_REQUIRED
  },
  isString: true,
  trim: true,
  custom: {
    options: (roleId: string) => {
      if (!isValidId(roleId)) {
        throw new Error(VALIDATION_ERROR_MESSAGE.ROLE_ID_INVALID);
      }
      return true;
    }
  }
};

const optionalProfileSchemas = {
  bio: {
    optional: true,
    isString: {
      errorMessage: VALIDATION_ERROR_MESSAGE.BIO_MUST_BE_A_STRING
    },
    isLength: {
      errorMessage: VALIDATION_ERROR_MESSAGE.BIO_LENGTH_MUST_BE_FROM_1_TO_500,
      options: { min: 1, max: 500 }
    },
    trim: true
  },
  location: {
    optional: true,
    isString: {
      errorMessage: VALIDATION_ERROR_MESSAGE.LOCATION_MUST_BE_A_STRING
    },
    isLength: {
      errorMessage: VALIDATION_ERROR_MESSAGE.LOCATION_LENGTH_MUST_BE_FROM_1_TO_500,
      options: { min: 1, max: 500 }
    },
    trim: true
  },
  website: {
    optional: true,
    isString: {
      errorMessage: VALIDATION_ERROR_MESSAGE.WEBSITE_MUST_BE_A_STRING
    },
    isLength: {
      errorMessage: VALIDATION_ERROR_MESSAGE.WEBSITE_LENGTH_MUST_BE_FROM_1_TO_500,
      options: { min: 1, max: 500 }
    },
    trim: true
  },
  username: {
    optional: true,
    isString: {
      errorMessage: VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_A_STRING
    },
    trim: true,
    custom: {
      options: (username: string) => {
        if (!USERNAME_REGEX.test(username)) {
          throw UsernameFormatInvalidException;
        }
        return true;
      }
    }
  },
  avatar: imageSchema,
  coverPhoto: imageSchema
};

export interface IAdminUsersPipe {
  userIdParam(): ExpressRequestHandler;
  createBodyPipe(): ExpressRequestHandler;
  updateBodyPipe(): ExpressRequestHandler;
}

export class AdminUsersPipe implements IAdminUsersPipe {
  @AutoBind()
  userIdParam() {
    return validate(
      checkSchema(
        {
          userId: {
            notEmpty: { errorMessage: VALIDATION_ERROR_MESSAGE.USER_ID_IS_REQUIRED },
            isString: {
              errorMessage: VALIDATION_ERROR_MESSAGE.USER_ID_MUST_BE_A_STRING
            },
            trim: true,
            custom: {
              options: (userId: string) => {
                if (!isValidId(userId)) {
                  throw InvalidUserIdException;
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
          name: nameSchema,
          email: emailSchema,
          password: passwordSchema,
          confirmPassword: confirmPasswordSchema,
          birthday: birthdaySchema,
          roleId: roleIdSchema,
          status: {
            optional: true,
            isIn: {
              options: [Object.values(EnumUserStatus)]
            }
          },
          ...optionalProfileSchemas
        },
        ['body']
      ),
      { assignMatchedBody: true, locations: ['body'] }
    );
  }

  @AutoBind()
  updateBodyPipe() {
    return validate(
      checkSchema(
        {
          name: {
            ...nameSchema,
            optional: true,
            notEmpty: undefined
          },
          email: {
            ...emailSchema,
            optional: true,
            notEmpty: undefined
          },
          password: {
            ...passwordSchema,
            optional: true,
            notEmpty: undefined
          },
          confirmPassword: {
            custom: {
              options: (value: unknown, { req }) => {
                const password = (req.body as Record<string, unknown>).password;
                if (password === undefined) return true;
                if (typeof value !== 'string' || value !== password) {
                  throw ConfirmPasswordMustMatchException;
                }
                return true;
              }
            }
          },
          birthday: {
            ...birthdaySchema,
            optional: true,
            notEmpty: undefined
          },
          roleId: {
            ...roleIdSchema,
            optional: true,
            notEmpty: undefined
          },
          status: {
            optional: true,
            isIn: {
              options: [Object.values(EnumUserStatus)]
            }
          },
          ...optionalProfileSchemas
        },
        ['body']
      ),
      { assignMatchedBody: true, locations: ['body'] }
    );
  }
}
