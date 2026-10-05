import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { requestObject } from '@/presentation/http/express/utils/schema.util';
import {
  birthdaySchema,
  confirmPasswordSchema,
  imageSchema,
  nameSchema,
  passwordSchema,
  trimmedString,
  usernameSchema
} from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import { forward, optional, partialCheck, pipe } from 'valibot';

/** Optional profile fields shared by self-update and admin create/update. */
export const optionalProfileEntries = {
  bio: optional(
    trimmedString(1, 500, {
      invalid: VALIDATION_ERROR_MESSAGE.BIO_MUST_BE_A_STRING,
      length: VALIDATION_ERROR_MESSAGE.BIO_LENGTH_MUST_BE_FROM_1_TO_500
    })
  ),
  location: optional(
    trimmedString(1, 500, {
      invalid: VALIDATION_ERROR_MESSAGE.LOCATION_MUST_BE_A_STRING,
      length: VALIDATION_ERROR_MESSAGE.LOCATION_LENGTH_MUST_BE_FROM_1_TO_500
    })
  ),
  website: optional(
    trimmedString(1, 500, {
      invalid: VALIDATION_ERROR_MESSAGE.WEBSITE_MUST_BE_A_STRING,
      length: VALIDATION_ERROR_MESSAGE.WEBSITE_LENGTH_MUST_BE_FROM_1_TO_500
    })
  ),
  username: optional(usernameSchema),
  avatar: optional(imageSchema),
  coverPhoto: optional(imageSchema)
};

export const UpdateMeBodySchema = requestObject({
  name: optional(nameSchema),
  birthday: optional(birthdaySchema),
  ...optionalProfileEntries
});

export const GetUserProfileParamsSchema = requestObject({
  username: usernameSchema
});

export const ChangePasswordBodySchema = pipe(
  requestObject({
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
