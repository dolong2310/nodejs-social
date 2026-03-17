import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ETokenType } from '@/enums/token.enum';
import { verifyAuthorizationMiddleware } from '@/middlewares/common.middleware';
import { dateOfBirthSchema, nameSchema } from '@/middlewares/users.middleware';
import { AuthFailureError, BadRequestError } from '@/models/error.response';
import authService from '@/services/auth.service';
import tokenService from '@/services/token.service';
import usersService from '@/services/users.service';
import { validate } from '@/utils/validation.util';
import { NextFunction, Request, Response } from 'express';
import { checkSchema, ParamSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';

export const emailSchema: ParamSchema = {
  notEmpty: {
    errorMessage: VALIDATION_ERROR_MESSAGE.EMAIL_IS_REQUIRED
  },
  isEmail: {
    errorMessage: VALIDATION_ERROR_MESSAGE.EMAIL_IS_INVALID
  },
  trim: true
};

export const passwordSchema: ParamSchema = {
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

export const confirmPasswordSchema: ParamSchema = {
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
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD);
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
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.EMAIL_ALREADY_EXISTS);
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
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
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
        isString: {
          errorMessage: VALIDATION_ERROR_MESSAGE.AUTHORIZATION_MUST_BE_A_STRING
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const token = value?.split(' ')[1];
            // if (!token) {
            //   throw new AuthFailureError();
            // }

            // // decode token
            // const decoded = await tokenService.verifyAccessToken(token);
            // if (decoded.type !== ETokenType.ACCESS_TOKEN) {
            //   throw new AuthFailureError();
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
              throw new AuthFailureError();
            }

            try {
              const [decoded, findRefreshToken] = await Promise.all([
                tokenService.verifyRefreshToken(value),
                authService.findRefreshTokenByToken(value)
              ]);
              if (decoded.type !== ETokenType.REFRESH_TOKEN || !findRefreshToken) {
                throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.REFRESH_TOKEN_IS_INVALID);
              }
              req.refreshTokenPayload = decoded;
              return true;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.REFRESH_TOKEN_IS_INVALID);
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
              throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_IS_REQUIRED);
            }

            try {
              const decoded = await tokenService.verifyEmailVerificationToken(value);
              if (decoded.type !== ETokenType.EMAIL_VERIFICATION_TOKEN) {
                throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_IS_INVALID);
              }

              req.emailVerificationTokenPayload = decoded;
              return true;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.EMAIL_VERIFICATION_TOKEN_IS_INVALID);
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
              throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_EMAIL_OR_PASSWORD);
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
              throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_REQUIRED);
            }

            try {
              const decoded = await tokenService.verifyForgotPasswordToken(value);
              if (decoded.type !== ETokenType.FORGOT_PASSWORD_TOKEN) {
                throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_INVALID);
              }

              req.forgotPasswordTokenPayload = decoded;
              return true;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.FORGOT_PASSWORD_TOKEN_IS_INVALID);
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

export const validateChangePassword = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirmPassword: confirmPasswordSchema
    },
    ['body']
  )
);

export const checkAuthWrapper = (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return handler(req, res, next);
    }
    next();
  };
};

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) {
    throw new AuthFailureError();
  }
  next();
};
