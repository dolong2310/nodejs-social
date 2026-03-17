import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { USERNAME_REGEX } from '@/constants/regex.constant';
import { verifyUserMiddleware } from '@/middlewares/common.middleware';
import { AuthFailureError, BadRequestError, NotFoundError } from '@/models/error.response';
import { IUser } from '@/models/schemas/user.schema';
import usersService from '@/services/users.service';
import { AccessTokenPayload } from '@/types/token.type';
import { validate } from '@/utils/validation.util';
import { NextFunction, Request, Response } from 'express';
import { checkSchema, Meta, ParamSchema } from 'express-validator';
import { ObjectId } from 'mongodb';

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

export const dateOfBirthSchema: ParamSchema = {
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

export const userIdSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.USER_ID_IS_REQUIRED
  },
  isString: {
    errorMessage: VALIDATION_ERROR_MESSAGE.USER_ID_MUST_BE_A_STRING
  },
  trim: true,
  custom: {
    options: async (userId: string, { req }: Meta) => {
      if (!ObjectId.isValid(userId)) {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_USER_ID);
      }

      const user = req.user as IUser | null;

      if (!user) {
        const findUser = await usersService.findUserById(userId);
        if (!findUser) {
          throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
        }
        req.user = findUser;
      }

      return true;
    }
  }
};

export const checkUserVerified = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.accessTokenPayload as AccessTokenPayload;
  if (!userId) {
    throw new AuthFailureError();
  }
  const user = await verifyUserMiddleware(userId);
  req.user = user;
  next();
};

export const validateUpdateMe = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      dateOfBirth: {
        ...dateOfBirthSchema,
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
          options: async (value: string) => {
            // check if username is valid format
            if (!USERNAME_REGEX.test(value)) {
              throw new BadRequestError(
                VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_4_TO_15_CHARACTERS_LONG_AND_CONTAIN_ONLY_LETTERS_NUMBERS_AND_UNDERSCORES
              );
            }

            // check if username already exists
            const user = await usersService.findUserByUsername(value);
            if (user) {
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.USERNAME_ALREADY_EXISTS);
            }

            return true;
          }
        }
      },
      avatar: imageSchema,
      coverPhoto: imageSchema
    },
    ['body']
  )
);
