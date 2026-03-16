import HTTP_STATUS from '@/constants/httpStatus.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { USERNAME_REGEX } from '@/constants/regex.constant';
import { ETokenType } from '@/enums/token.enum';
import { verifyAuthorizationMiddleware, verifyUserMiddleware } from '@/middlewares/common.middleware';
import { ErrorWithStatus } from '@/models/error.model';
import { IUser } from '@/models/schemas/user.schema';
import tokenService from '@/services/token.service';
import usersService from '@/services/users.service';
import { AccessTokenPayload } from '@/types/token.type';
import { validate } from '@/utils/validation.util';
import { NextFunction, Request, Response } from 'express';
import { checkSchema, Meta, ParamSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const emailSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.EMAIL_IS_REQUIRED
  },
  isEmail: {
    errorMessage: VALIDATION_ERROR_MESSAGE.EMAIL_IS_INVALID
  },
  trim: true
};

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: VALIDATION_ERROR_MESSAGE.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    errorMessage: VALIDATION_ERROR_MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
    options: {
      min: 6,
      max: 50
    }
  },
  isStrongPassword: {
    errorMessage: VALIDATION_ERROR_MESSAGE.PASSWORD_MUST_BE_STRONG,
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  }
};

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    errorMessage: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
    options: {
      min: 6,
      max: 50
    }
  },
  isStrongPassword: {
    errorMessage: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRONG,
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new ErrorWithStatus({
          message: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD,
          status: HTTP_STATUS.BAD_REQUEST
        });
      }
      return true;
    }
  }
};

const nameSchema: ParamSchema = {
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

const dateOfBirthSchema: ParamSchema = {
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

const imageSchema: ParamSchema = {
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
        throw new ErrorWithStatus({
          message: VALIDATION_ERROR_MESSAGE.INVALID_USER_ID,
          status: HTTP_STATUS.BAD_REQUEST
        });
      }

      const user = req.user as IUser | null;

      if (!user) {
        const findUser = await usersService.findUserById(userId);
        if (!findUser) {
          throw new ErrorWithStatus({
            message: VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND,
            status: HTTP_STATUS.NOT_FOUND
          });
        }
        req.user = findUser;
      }

      return true;
    }
  }
};

export const validateRegister = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        ...emailSchema,
        custom: {
          options: async (value) => {
            const user = await usersService.findUserByEmail(value as string);
            if (user) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }
            return true;
          }
        }
      },
      password: passwordSchema,
      confirmPassword: confirmPasswordSchema,
      dateOfBirth: dateOfBirthSchema
    },
    ['body']
  )
);

export const validateLogin = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await usersService.findUserByEmail(value as string);
            if (user) {
              req.user = user;
            } else {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }
            return true;
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
);

export const validateAccessToken = validate(
  checkSchema(
    {
      Authorization: {
        // notEmpty: {
        //   errorMessage: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_REQUIRED
        // },
        isString: {
          errorMessage: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const token = value?.split(' ')[1];
            // if (!token) {
            //   throw new ErrorWithStatus({
            //     message: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_REQUIRED,
            //     status: HTTP_STATUS.UNAUTHORIZED
            //   });
            // }

            // // decode token
            // const decoded = await tokenService.verifyAccessToken(token);
            // if (decoded.type !== ETokenType.ACCESS_TOKEN) {
            //   throw new ErrorWithStatus({
            //     message: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_INVALID,
            //     status: HTTP_STATUS.UNAUTHORIZED
            //   });
            // }
            const decoded = await verifyAuthorizationMiddleware(token);
            req.accessTokenPayload = decoded;
            return true;
          }
        }
      }
    },
    ['headers']
  )
);

export const validateRefreshToken = validate(
  checkSchema(
    {
      refreshToken: {
        // notEmpty: {
        //   errorMessage: VALIDATION_ERROR_MESSAGE.REFRESH_TOKEN_IS_REQUIRED
        // },
        isString: {
          errorMessage: VALIDATION_ERROR_MESSAGE.REFRESH_TOKEN_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            try {
              const [decoded, findRefreshToken] = await Promise.all([
                tokenService.verifyRefreshToken(value),
                usersService.findRefreshTokenByToken(value)
              ]);
              if (decoded.type !== ETokenType.REFRESH_TOKEN || !findRefreshToken) {
                throw new ErrorWithStatus({
                  message: VALIDATION_ERROR_MESSAGE.REFRESH_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }
              req.refreshTokenPayload = decoded;
              return true;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }
              throw error;
            }
          }
        }
      }
    },
    ['body']
  )
);

export const validateEmailVerificationToken = validate(
  checkSchema(
    {
      token: {
        isString: {
          errorMessage: VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            try {
              const decoded = await tokenService.verifyEmailVerificationToken(value);
              if (decoded.type !== ETokenType.EMAIL_VERIFICATION_TOKEN) {
                throw new ErrorWithStatus({
                  message: VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }

              req.emailVerificationTokenPayload = decoded;
              return true;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.BAD_REQUEST
                });
              }
              throw error;
            }
          }
        }
      }
    },
    ['body']
  )
);

export const validateForgotPassword = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await usersService.findUserByEmail(value as string);
            if (user) {
              req.user = user;
            } else {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const validateForgotPasswordToken = validate(
  checkSchema(
    {
      token: {
        isString: {
          errorMessage: VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }

            try {
              const decoded = await tokenService.verifyForgotPasswordToken(value);
              if (decoded.type !== ETokenType.FORGOT_PASSWORD_TOKEN) {
                throw new ErrorWithStatus({
                  message: VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }

              req.forgotPasswordTokenPayload = decoded;
              return true;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                  status: HTTP_STATUS.BAD_REQUEST
                });
              }
              throw error;
            }
          }
        }
      },
      password: passwordSchema,
      confirmPassword: confirmPasswordSchema
    },
    ['body']
  )
);

export const checkUserVerified = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.accessTokenPayload as AccessTokenPayload;
  if (!userId) {
    throw new ErrorWithStatus({
      message: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
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
              throw new ErrorWithStatus({
                message:
                  VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_4_TO_15_CHARACTERS_LONG_AND_CONTAIN_ONLY_LETTERS_NUMBERS_AND_UNDERSCORES,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }

            // check if username already exists
            const user = await usersService.findUserByUsername(value);
            if (user) {
              throw new ErrorWithStatus({
                message: VALIDATION_ERROR_MESSAGE.USERNAME_ALREADY_EXISTS,
                status: HTTP_STATUS.BAD_REQUEST
              });
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

export const validateChangePassword = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirmPassword: confirmPasswordSchema
    },
    ['body']
  )
);
