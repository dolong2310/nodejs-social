import { USERNAME_REGEX } from '@/modules/common/constants/regex.constants';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import {
  InvalidUserIdException,
  UsernameFormatInvalidException
} from '@/presentation/http/express/exceptions/user.exception';
import type { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { confirmPasswordSchema, passwordSchema } from '@/presentation/http/express/v1/pipes/auth.pipe';
import type { Request } from 'express';
import { type Location, type ParamSchema, checkSchema } from 'express-validator';

export const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: VALIDATION_ERROR_MESSAGE.NAME_MUST_BE_A_STRING
  },
  isLength: {
    errorMessage: VALIDATION_ERROR_MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100,
    options: {
      min: 1,
      max: 100
    }
  }
};

export const birthdaySchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.DATE_OF_BIRTH_IS_REQUIRED
  },
  isISO8601: {
    errorMessage: VALIDATION_ERROR_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601,
    options: {
      strict: true,
      strictSeparator: true
    }
  }
};

export const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: VALIDATION_ERROR_MESSAGE.IMAGE_MUST_BE_A_STRING
  },
  isLength: {
    errorMessage: VALIDATION_ERROR_MESSAGE.IMAGE_LENGTH_MUST_BE_FROM_1_TO_500,
    options: {
      min: 1,
      max: 500
    }
  },
  trim: true
};

export interface IUserPipe {
  updateMePipe: ExpressRequestHandler;
  userIdPipe: (key: string, location: Location) => ExpressRequestHandler;
  usernamePipe: (key: string, location: Location) => ExpressRequestHandler;
  changePasswordPipe: ExpressRequestHandler;
}

export class UsersPipe implements IUserPipe {
  updateMePipe = validate(
    checkSchema(
      {
        name: {
          ...nameSchema,
          optional: true,
          notEmpty: undefined
        },
        birthday: {
          ...birthdaySchema,
          optional: true
        },
        bio: {
          optional: true,
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.BIO_MUST_BE_A_STRING
          },
          isLength: {
            errorMessage: VALIDATION_ERROR_MESSAGE.BIO_LENGTH_MUST_BE_FROM_1_TO_500,
            options: {
              min: 1,
              max: 500
            }
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
            options: {
              min: 1,
              max: 500
            }
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
            options: {
              min: 1,
              max: 500
            }
          },
          trim: true
        },
        username: {
          optional: true,
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_A_STRING
          },
          // isLength: {
          //   errorMessage: VALIDATION_ERROR_MESSAGE.USERNAME_LENGTH_MUST_BE_FROM_1_TO_50,
          //   options: {
          //     min: 1,
          //     max: 50
          //   }
          // },
          trim: true,
          custom: {
            options: (username: string, { req }) => {
              if (!USERNAME_REGEX.test(username)) {
                throw UsernameFormatInvalidException;
              }

              // If the submitted username matches the current username, skip the unnecessary DB query.
              const authenticatedUser = (req as Request).user;
              if (authenticatedUser?.username === username) {
                return true;
              }
              return true;
            }
          }
        },
        avatar: imageSchema,
        coverPhoto: imageSchema
      },
      ['body']
    ),
    { assignMatchedBody: true, locations: ['body'] }
  );

  @AutoBind()
  userIdPipe(key: string, location: Location) {
    return validate(
      checkSchema(
        {
          [key]: {
            notEmpty: {
              errorMessage: VALIDATION_ERROR_MESSAGE.USER_ID_IS_REQUIRED
            },
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
        [location]
      )
    );
  }

  @AutoBind()
  usernamePipe(key: string, location: Location) {
    return validate(
      checkSchema(
        {
          [key]: {
            notEmpty: {
              errorMessage: VALIDATION_ERROR_MESSAGE.USERNAME_IS_REQUIRED
            },
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
          }
        },
        [location]
      )
    );
  }

  changePasswordPipe = validate(
    checkSchema(
      {
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema
      },
      ['body']
    )
  );
}
