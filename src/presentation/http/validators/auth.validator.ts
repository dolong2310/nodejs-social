import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/constants/message.constant';
import { ConfirmPasswordMustMatchException } from '@/presentation/http/exceptions/auth.exception';
import { validate } from '@/presentation/http/utils/validation.util';
import { birthdaySchema, nameSchema } from '@/presentation/http/validators/user.validator';
import { RequestHandler } from 'express';
import { ParamsDictionary, Query } from 'express-serve-static-core';
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

export interface IAuthValidator {
  registerValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  loginValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
  forgotPasswordValidator: RequestHandler<ParamsDictionary, object, object, Query, Record<string, unknown>>;
}

export class AuthValidator implements IAuthValidator {
  constructor() {}

  registerValidator = validate(
    checkSchema(
      {
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: confirmPasswordSchema,
        birthday: birthdaySchema
      },
      ['body']
    )
  );

  loginValidator = validate(
    checkSchema(
      {
        email: emailSchema,
        password: passwordSchema
      },
      ['body']
    )
  );

  forgotPasswordValidator = validate(
    checkSchema(
      {
        email: emailSchema
      },
      ['body']
    )
  );
}
