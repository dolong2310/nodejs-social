import { EOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import { ConfirmPasswordMustMatchException } from '@/presentation/http/express/exceptions/auth.exception';
import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { birthdaySchema, nameSchema } from '@/presentation/http/express/v1/pipes/user.pipe';
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
        throw ConfirmPasswordMustMatchException;
      }
      return true;
    }
  }
};

export interface IAuthPipe {
  registerPipe: ExpressRequestHandler;
  loginPipe: ExpressRequestHandler;
  forgotPasswordPipe: ExpressRequestHandler;
  sendOtpPipe: ExpressRequestHandler;
  disable2faPipe: ExpressRequestHandler;
}

export class AuthPipe implements IAuthPipe {
  constructor() {}

  registerPipe = validate(
    checkSchema(
      {
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema,
        birthday: birthdaySchema,
        code: {
          isString: true,
          isLength: {
            options: { min: 6, max: 6 }
          }
        }
      },
      ['body']
    )
  );

  loginPipe = validate(
    checkSchema(
      {
        email: emailSchema,
        password: passwordSchema,
        totpCode: {
          optional: true,
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.TOTP_CODE_MUST_BE_A_STRING
          },
          isLength: {
            options: { min: 6, max: 6 },
            errorMessage: VALIDATION_ERROR_MESSAGE.TOTP_CODE_MUST_BE_6_CHARACTERS
          },
          custom: {
            options: (value, { req }) => {
              const hasEmailOtpCode = (req.body as Record<string, unknown>)?.emailOtpCode !== undefined;
              if (value !== undefined && hasEmailOtpCode) {
                throw new Error(VALIDATION_ERROR_MESSAGE.TOTP_AND_EMAIL_OTP_CANNOT_BOTH_BE_PROVIDED);
              }
              return true;
            }
          }
        },
        emailOtpCode: {
          optional: true,
          isString: {
            errorMessage: VALIDATION_ERROR_MESSAGE.EMAIL_OTP_CODE_MUST_BE_A_STRING
          },
          isLength: {
            options: { min: 6, max: 6 },
            errorMessage: VALIDATION_ERROR_MESSAGE.EMAIL_OTP_CODE_MUST_BE_6_CHARACTERS
          },
          custom: {
            options: (value, { req }) => {
              const hasTotpCode = (req.body as Record<string, unknown>)?.totpCode !== undefined;
              if (value !== undefined && hasTotpCode) {
                throw new Error(VALIDATION_ERROR_MESSAGE.TOTP_AND_EMAIL_OTP_CANNOT_BOTH_BE_PROVIDED);
              }
              return true;
            }
          }
        }
      },
      ['body']
    )
  );

  forgotPasswordPipe = validate(
    checkSchema(
      {
        email: emailSchema
      },
      ['body']
    )
  );

  sendOtpPipe = validate(
    checkSchema(
      {
        email: emailSchema,
        type: {
          notEmpty: {
            errorMessage: VALIDATION_ERROR_MESSAGE.TYPE_IS_REQUIRED
          },
          isIn: {
            options: [[EOtpType.REGISTER, EOtpType.LOGIN, EOtpType.FORGOT_PASSWORD, EOtpType.DISABLE_2FA]],
            errorMessage: VALIDATION_ERROR_MESSAGE.TYPE_IS_INVALID
          },
          trim: true
        }
      },
      ['body']
    )
  );

  disable2faPipe = validate(
    checkSchema(
      {
        totpCode: {
          custom: {
            options: (value, { req }) => {
              const hasTotpCode = value !== undefined;
              const hasEmailOtpCode = (req.body as Record<string, unknown>)?.emailOtpCode !== undefined;
              if (hasTotpCode === hasEmailOtpCode) {
                throw new Error(VALIDATION_ERROR_MESSAGE.ONLY_ONE_OF_TOTP_OR_EMAIL_OTP_REQUIRED);
              }
              if (hasTotpCode) {
                if (typeof value !== 'string') {
                  throw new Error(VALIDATION_ERROR_MESSAGE.TOTP_CODE_MUST_BE_A_STRING);
                }
                if (value.length !== 6) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.TOTP_CODE_MUST_BE_6_CHARACTERS);
                }
              }
              return true;
            }
          }
        },
        emailOtpCode: {
          custom: {
            options: (value, { req }) => {
              const hasTotpCode = (req.body as Record<string, unknown>)?.totpCode !== undefined;
              const hasEmailOtpCode = value !== undefined;
              if (hasTotpCode === hasEmailOtpCode) {
                throw new Error(VALIDATION_ERROR_MESSAGE.ONLY_ONE_OF_TOTP_OR_EMAIL_OTP_REQUIRED);
              }
              if (hasEmailOtpCode) {
                if (typeof value !== 'string') {
                  throw new Error(VALIDATION_ERROR_MESSAGE.EMAIL_OTP_CODE_MUST_BE_A_STRING);
                }
                if (value.length !== 6) {
                  throw new Error(VALIDATION_ERROR_MESSAGE.EMAIL_OTP_CODE_MUST_BE_6_CHARACTERS);
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
