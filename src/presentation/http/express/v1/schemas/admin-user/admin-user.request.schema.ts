import { EnumUserStatus } from '@/modules/user/domain/entities/user.types';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { requestObject } from '@/presentation/http/express/utils/schema.util';
import {
  birthdaySchema,
  confirmPasswordSchema,
  emailSchema,
  nameSchema,
  passwordSchema,
  userIdSchema
} from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import { roleIdSchema } from '@/presentation/http/express/v1/schemas/role/role.request.schema';
import { optionalProfileEntries } from '@/presentation/http/express/v1/schemas/user/user.request.schema';
import { enum_, forward, optional, partialCheck, pipe, string } from 'valibot';

const statusSchema = enum_(EnumUserStatus);

export const AdminUserIdParamsSchema = requestObject({ userId: userIdSchema });

export const AdminCreateUserBodySchema = pipe(
  requestObject({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    birthday: birthdaySchema,
    roleId: roleIdSchema,
    status: optional(statusSchema),
    ...optionalProfileEntries
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

export const AdminUpdateUserBodySchema = pipe(
  requestObject({
    name: optional(nameSchema),
    email: optional(emailSchema),
    password: optional(passwordSchema),
    confirmPassword: optional(string(VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD)),
    birthday: optional(birthdaySchema),
    roleId: optional(roleIdSchema),
    status: optional(statusSchema),
    ...optionalProfileEntries
  }),
  // confirmPassword is only required (and must match) when the password is being changed.
  forward(
    partialCheck(
      [['password'], ['confirmPassword']],
      (input) => input.password === undefined || input.password === input.confirmPassword,
      VALIDATION_ERROR_MESSAGE.CONFIRM_PASSWORD_MUST_MATCH_PASSWORD
    ),
    ['confirmPassword']
  )
);
