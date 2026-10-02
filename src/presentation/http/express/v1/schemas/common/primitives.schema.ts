import { USERNAME_REGEX } from '@/modules/common/constants/regex.constants';
import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { Username } from '@/modules/common/domain/value-objects/username.value-object';
import { isValidId } from '@/modules/core/domain/helpers/ids';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { requiredString } from '@/presentation/http/express/utils/schema.util';
import {
  check,
  email,
  ISO_DATE_REGEX,
  ISO_TIMESTAMP_REGEX,
  length,
  maxLength,
  minLength,
  nonEmpty,
  pipe,
  regex,
  string,
  toDate,
  transform,
  trim
} from 'valibot';

/**
 * Trimmed string with a length range. Use for optional free-text fields (bio, location...).
 */
export const trimmedString = (min: number, max: number, messages: { invalid: string; length: string }) =>
  pipe(string(messages.invalid), trim(), minLength(min, messages.length), maxLength(max, messages.length));

/**
 * Entity id (UUID v7, optional prefix) coming from params/body/query.
 */
export const idSchema = (messages: { required: string; invalid: string; format: string }) =>
  pipe(
    requiredString({ required: messages.required, invalid: messages.invalid }),
    trim(),
    nonEmpty(messages.required),
    check(isValidId, messages.format)
  );

export const userIdSchema = idSchema({
  required: VALIDATION_ERROR_MESSAGE.USER_ID_IS_REQUIRED,
  invalid: VALIDATION_ERROR_MESSAGE.USER_ID_MUST_BE_A_STRING,
  format: VALIDATION_ERROR_MESSAGE.INVALID_USER_ID
});

export const nameSchema = pipe(
  requiredString({
    required: VALIDATION_ERROR_MESSAGE.NAME_IS_REQUIRED,
    invalid: VALIDATION_ERROR_MESSAGE.NAME_MUST_BE_A_STRING
  }),
  trim(),
  nonEmpty(VALIDATION_ERROR_MESSAGE.NAME_IS_REQUIRED),
  maxLength(100, VALIDATION_ERROR_MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100)
);

export const emailSchema = pipe(
  requiredString({
    required: VALIDATION_ERROR_MESSAGE.EMAIL_IS_REQUIRED,
    invalid: VALIDATION_ERROR_MESSAGE.EMAIL_IS_INVALID
  }),
  trim(),
  nonEmpty(VALIDATION_ERROR_MESSAGE.EMAIL_IS_REQUIRED),
  email(VALIDATION_ERROR_MESSAGE.EMAIL_IS_INVALID),
  transform(EmailAddress.normalize)
);

/**
 * Trimmed, format-checked and normalized (lower-cased) username.
 */
export const usernameSchema = pipe(
  requiredString({
    required: VALIDATION_ERROR_MESSAGE.USERNAME_IS_REQUIRED,
    invalid: VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_A_STRING
  }),
  trim(),
  nonEmpty(VALIDATION_ERROR_MESSAGE.USERNAME_IS_REQUIRED),
  regex(
    USERNAME_REGEX,
    VALIDATION_ERROR_MESSAGE.USERNAME_MUST_BE_4_TO_15_CHARACTERS_LONG_AND_CONTAIN_ONLY_LETTERS_NUMBERS_AND_UNDERSCORES
  ),
  transform((value) => Username.normalize(value) as string)
);

// Same rule as validator.js isStrongPassword({ minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
const isStrongPassword = (value: string): boolean =>
  /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);

const strongPasswordSchema = (messages: { required: string; invalid: string; length: string; strong: string }) =>
  pipe(
    requiredString({ required: messages.required, invalid: messages.invalid }),
    nonEmpty(messages.required),
    minLength(6, messages.length),
    maxLength(50, messages.length),
    check(isStrongPassword, messages.strong)
  );

export const passwordSchema = strongPasswordSchema({
  required: VALIDATION_ERROR_MESSAGE.PASSWORD_IS_REQUIRED,
  invalid: VALIDATION_ERROR_MESSAGE.PASSWORD_MUST_BE_A_STRING,
  length: VALIDATION_ERROR_MESSAGE.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
  strong: VALIDATION_ERROR_MESSAGE.PASSWORD_MUST_BE_STRONG
});

export const confirmPasswordSchema = strongPasswordSchema({
  required: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED,
  invalid: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_BE_A_STRING,
  length: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50,
  strong: VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRONG
});

/**
 * ISO 8601 date (`YYYY-MM-DD`) or timestamp, kept as a string.
 */
export const isoDateStringSchema = (messages: { required: string; invalid: string }) =>
  pipe(
    requiredString(messages),
    trim(),
    nonEmpty(messages.required),
    check((value) => ISO_DATE_REGEX.test(value) || ISO_TIMESTAMP_REGEX.test(value), messages.invalid)
  );

/**
 * ISO 8601 date (`YYYY-MM-DD`) or timestamp, converted to `Date`.
 */
export const isoDateSchema = (messages: { required: string; invalid: string }) =>
  pipe(isoDateStringSchema(messages), toDate(messages.invalid));

const birthdayMessages = {
  required: VALIDATION_ERROR_MESSAGE.DATE_OF_BIRTH_IS_REQUIRED,
  invalid: VALIDATION_ERROR_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
};

export const birthdaySchema = isoDateSchema(birthdayMessages);
export const birthdayStringSchema = isoDateStringSchema(birthdayMessages);

/**
 * Fixed-length (6) one-time code: OTP, TOTP.
 */
export const otpCodeSchema = (messages: { invalid: string; length: string }) =>
  pipe(string(messages.invalid), trim(), length(6, messages.length));

export const imageSchema = trimmedString(1, 500, {
  invalid: VALIDATION_ERROR_MESSAGE.IMAGE_MUST_BE_A_STRING,
  length: VALIDATION_ERROR_MESSAGE.IMAGE_LENGTH_MUST_BE_FROM_1_TO_500
});
