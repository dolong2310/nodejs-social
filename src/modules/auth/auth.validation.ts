import { REFRESH_TOKEN_COOKIE_NAME, VALIDATION_ERROR_MESSAGE } from '@/constants';
import { AutoBind, Injectable } from '@/decorators';
import { ETokenType } from '@/interfaces';
import {
  ConfirmPasswordMustMatchException,
  dateOfBirthSchema,
  InvalidTokenAuthFailureException,
  nameSchema,
  NoTokenProvidedException,
  TokenIsRequiredException
} from '@/modules';
import { TokenService } from '@/shared';
import { validate } from '@/utils';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { checkSchema, ParamSchema } from 'express-validator';
import jwt from 'jsonwebtoken';

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
        throw ConfirmPasswordMustMatchException;
      }
      return true;
    }
  }
};

export interface IAuthValidation {
  registerValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  loginValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  verifyEmailValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  forgotPasswordValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  resetPasswordValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  changePasswordValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  refreshTokenValidation: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

@Injectable()
export class AuthValidation implements IAuthValidation {
  constructor(private readonly tokenService: TokenService) {}

  @AutoBind()
  registerValidation() {
    return validate(
      checkSchema(
        {
          name: nameSchema,
          email: emailSchema,
          password: passwordSchema,
          confirmPassword: confirmPasswordSchema,
          dateOfBirth: dateOfBirthSchema
        },
        ['body']
      )
    );
  }

  @AutoBind()
  loginValidation() {
    return validate(
      checkSchema(
        {
          email: emailSchema,
          password: passwordSchema
        },
        ['body']
      )
    );
  }

  @AutoBind()
  verifyEmailValidation() {
    return validate(
      checkSchema(
        {
          token: {
            isString: {
              errorMessage: VALIDATION_ERROR_MESSAGE.TOKEN_MUST_BE_STRING
            },
            trim: true,

            custom: {
              options: async (token: string, { req }) => {
                if (!token) {
                  throw TokenIsRequiredException;
                }

                try {
                  const decoded = await this.tokenService.verifyEmailVerificationToken(token);
                  if (decoded.type !== ETokenType.EMAIL_VERIFICATION_TOKEN) {
                    throw InvalidTokenAuthFailureException;
                  }

                  req.tokenPayload = decoded;
                  return true;
                } catch (error) {
                  if (error instanceof jwt.JsonWebTokenError) {
                    throw InvalidTokenAuthFailureException;
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
  }

  @AutoBind()
  forgotPasswordValidation() {
    return validate(
      checkSchema(
        {
          email: emailSchema
        },
        ['body']
      )
    );
  }

  @AutoBind()
  resetPasswordValidation() {
    return validate(
      checkSchema(
        {
          password: passwordSchema,
          confirmPassword: confirmPasswordSchema,
          token: {
            isString: {
              errorMessage: VALIDATION_ERROR_MESSAGE.TOKEN_MUST_BE_STRING
            },
            trim: true,
            custom: {
              options: async (value: string, { req }) => {
                if (!value) {
                  throw TokenIsRequiredException;
                }

                try {
                  const decoded = await this.tokenService.verifyForgotPasswordToken(value);
                  if (decoded.type !== ETokenType.FORGOT_PASSWORD_TOKEN) {
                    throw InvalidTokenAuthFailureException;
                  }

                  req.tokenPayload = decoded;
                  return true;
                } catch (error) {
                  if (error instanceof jwt.JsonWebTokenError) {
                    throw InvalidTokenAuthFailureException;
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
  }

  @AutoBind()
  changePasswordValidation() {
    return validate(
      checkSchema(
        {
          password: passwordSchema,
          confirmPassword: confirmPasswordSchema
        },
        ['body']
      )
    );
  }

  @AutoBind()
  async refreshTokenValidation(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!token || typeof token !== 'string' || !token.trim()) {
      next(NoTokenProvidedException);
      return;
    }

    const trimmed = token.trim();
    try {
      const decoded = await this.tokenService.verifyRefreshToken(trimmed);
      req.tokenPayload = decoded;
      req.refreshTokenJwt = trimmed;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        next(InvalidTokenAuthFailureException);
        return;
      }
      next(error);
    }
  }
}
