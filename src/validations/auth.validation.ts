import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ETokenType } from '@/enums/token.enum';
import { dateOfBirthSchema, nameSchema } from '@/validations/users.validation';
import { AuthFailureError, BadRequestError, ForbiddenError } from '@/responses/error.response';
import { ITokenService } from '@/services/token.service';
import { validate } from '@/utils/validation.util';
import { RequestHandler } from 'express';
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
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD);
      }
      return true;
    }
  }
};

export interface IAuthValidation {
  registerValidation: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>>;
  loginValidation: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>>;
  verifyEmailValidation: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>>;
  forgotPasswordValidation: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>>;
  resetPasswordValidation: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>>;
  changePasswordValidation: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>>;
  refreshTokenValidation: RequestHandler<ParamsDictionary, any, any, Query, Record<string, any>>;
}

class AuthValidation implements IAuthValidation {
  constructor(private readonly tokenService: ITokenService) {}

  registerValidation = validate(
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

  loginValidation = validate(
    checkSchema(
      {
        email: emailSchema,
        password: passwordSchema
      },
      ['body']
    )
  );

  verifyEmailValidation = validate(
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
                throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_REQUIRED);
              }

              try {
                const decoded = await this.tokenService.verifyEmailVerificationToken(token);
                if (decoded.type !== ETokenType.EMAIL_VERIFICATION_TOKEN) {
                  throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
                }

                req.tokenPayload = decoded;
                return true;
              } catch (error) {
                if (error instanceof jwt.JsonWebTokenError) {
                  throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
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

  forgotPasswordValidation = validate(
    checkSchema(
      {
        email: emailSchema
      },
      ['body']
    )
  );

  resetPasswordValidation = validate(
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
                throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_REQUIRED);
              }

              try {
                const decoded = await this.tokenService.verifyForgotPasswordToken(value);
                if (decoded.type !== ETokenType.FORGOT_PASSWORD_TOKEN) {
                  throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
                }

                req.tokenPayload = decoded;
                return true;
              } catch (error) {
                if (error instanceof jwt.JsonWebTokenError) {
                  throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
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

  changePasswordValidation = validate(
    checkSchema(
      {
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema
      },
      ['body']
    )
  );

  refreshTokenValidation = validate(
    checkSchema(
      {
        refreshToken: {
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.TOKEN_MUST_BE_STRING
          },
          trim: true,
          custom: {
            options: async (token: string | undefined, { req }) => {
              if (!token) {
                throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.NO_TOKEN_PROVIDED);
              }

              try {
                const decoded = await this.tokenService.verifyRefreshToken(token);
                req.tokenPayload = decoded;
                return true;
              } catch (error) {
                if (error instanceof jwt.JsonWebTokenError) {
                  throw new AuthFailureError(VALIDATION_ERROR_MESSAGE.TOKEN_IS_INVALID);
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

export default AuthValidation;
