import { ROLE_NAME_REGEX } from '@/modules/common/constants/regex.constants';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { requestObject, requiredString } from '@/presentation/http/express/utils/schema.util';
import { idSchema } from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import { array, boolean, maxLength, nonEmpty, optional, pipe, regex, string, trim } from 'valibot';

export const roleIdSchema = idSchema({
  required: VALIDATION_ERROR_MESSAGE.ROLE_ID_IS_REQUIRED,
  invalid: VALIDATION_ERROR_MESSAGE.ROLE_ID_INVALID,
  format: VALIDATION_ERROR_MESSAGE.ROLE_ID_INVALID
});

const permissionIdSchema = idSchema({
  required: VALIDATION_ERROR_MESSAGE.PERMISSION_ID_IS_REQUIRED,
  invalid: VALIDATION_ERROR_MESSAGE.PERMISSION_ID_INVALID,
  format: VALIDATION_ERROR_MESSAGE.PERMISSION_ID_INVALID
});

const roleNameSchema = pipe(
  requiredString({
    required: VALIDATION_ERROR_MESSAGE.ROLE_NAME_IS_REQUIRED,
    invalid: VALIDATION_ERROR_MESSAGE.ROLE_NAME_INVALID
  }),
  trim(),
  nonEmpty(VALIDATION_ERROR_MESSAGE.ROLE_NAME_IS_REQUIRED),
  maxLength(64, VALIDATION_ERROR_MESSAGE.ROLE_NAME_INVALID),
  regex(ROLE_NAME_REGEX, VALIDATION_ERROR_MESSAGE.ROLE_NAME_INVALID)
);

export const RoleIdParamsSchema = requestObject({ roleId: roleIdSchema });

export const CreateRoleBodySchema = requestObject({
  name: roleNameSchema,
  description: optional(pipe(string(), trim())),
  isActive: optional(boolean(), true),
  permissionIds: optional(array(permissionIdSchema))
});

export const UpdateRoleBodySchema = requestObject({
  name: optional(roleNameSchema),
  description: optional(pipe(string(), trim())),
  isActive: optional(boolean()),
  permissionIds: optional(array(permissionIdSchema))
});
