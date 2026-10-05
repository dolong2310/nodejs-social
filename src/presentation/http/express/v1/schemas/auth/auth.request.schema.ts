import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.types';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { requestObject } from '@/presentation/http/express/utils/schema.util';
import {
  birthdayStringSchema,
  confirmPasswordSchema,
  emailSchema,
  nameSchema,
  otpCodeSchema,
  passwordSchema
} from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import { check, forward, optional, partialCheck, picklist, pipe, string, trim } from 'valibot';

const totpCodeSchema = otpCodeSchema({
  invalid: VALIDATION_ERROR_MESSAGE.TOTP_CODE_MUST_BE_A_STRING,
  length: VALIDATION_ERROR_MESSAGE.TOTP_CODE_MUST_BE_6_CHARACTERS
});

const emailOtpCodeSchema = otpCodeSchema({
  invalid: VALIDATION_ERROR_MESSAGE.EMAIL_OTP_CODE_MUST_BE_A_STRING,
  length: VALIDATION_ERROR_MESSAGE.EMAIL_OTP_CODE_MUST_BE_6_CHARACTERS
});

const verificationCodeSchema = otpCodeSchema({
  invalid: VALIDATION_ERROR_MESSAGE.EMAIL_OTP_CODE_MUST_BE_A_STRING,
  length: VALIDATION_ERROR_MESSAGE.EMAIL_OTP_CODE_MUST_BE_6_CHARACTERS
});

export const RegisterBodySchema = pipe(
  requestObject({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    birthday: birthdayStringSchema,
    code: verificationCodeSchema
  }),
  forward(
    partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD
    ),
    ['confirmPassword']
  )
);

export const LoginBodySchema = pipe(
  requestObject({
    email: emailSchema,
    password: passwordSchema,
    totpCode: optional(totpCodeSchema),
    emailOtpCode: optional(emailOtpCodeSchema)
  }),
  forward(
    check(
      (input) => input.totpCode === undefined || input.emailOtpCode === undefined,
      VALIDATION_ERROR_MESSAGE.TOTP_AND_EMAIL_OTP_CANNOT_BOTH_BE_PROVIDED
    ),
    ['totpCode']
  )
);

export const ForgotPasswordBodySchema = pipe(
  requestObject({
    email: emailSchema,
    code: verificationCodeSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema
  }),
  forward(
    partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === input.confirmPassword,
      VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD
    ),
    ['confirmPassword']
  )
);

export const SendOtpBodySchema = requestObject({
  email: emailSchema,
  type: pipe(
    string(VALIDATION_ERROR_MESSAGE.TYPE_IS_REQUIRED),
    trim(),
    picklist(
      [EnumOtpType.REGISTER, EnumOtpType.LOGIN, EnumOtpType.FORGOT_PASSWORD, EnumOtpType.DISABLE_2FA],
      VALIDATION_ERROR_MESSAGE.TYPE_IS_INVALID
    )
  )
});

export const Disable2faBodySchema = pipe(
  requestObject({
    totpCode: optional(totpCodeSchema),
    emailOtpCode: optional(emailOtpCodeSchema)
  }),
  forward(
    check(
      (input) => (input.totpCode === undefined) !== (input.emailOtpCode === undefined),
      VALIDATION_ERROR_MESSAGE.ONLY_ONE_OF_TOTP_OR_EMAIL_OTP_REQUIRED
    ),
    ['totpCode']
  )
);
