import { EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.types';
import { MODULE_TAG_REGEX } from '@/modules/common/constants/regex.constants';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { requestObject, requiredString } from '@/presentation/http/express/utils/schema.util';
import { idSchema } from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import { enum_, maxLength, nonEmpty, optional, pipe, regex, startsWith, trim } from 'valibot';

const requiredTrimmed = (required: string) =>
  pipe(requiredString({ required, invalid: required }), trim(), nonEmpty(required));

const permissionNameSchema = pipe(
  requiredTrimmed(VALIDATION_ERROR_MESSAGE.PERMISSION_NAME_IS_REQUIRED),
  maxLength(128, VALIDATION_ERROR_MESSAGE.PERMISSION_NAME_IS_REQUIRED)
);
const permissionDescriptionSchema = requiredTrimmed(VALIDATION_ERROR_MESSAGE.PERMISSION_DESCRIPTION_IS_REQUIRED);
const permissionPathSchema = pipe(
  requiredTrimmed(VALIDATION_ERROR_MESSAGE.PERMISSION_PATH_IS_REQUIRED),
  startsWith('/', VALIDATION_ERROR_MESSAGE.PERMISSION_PATH_INVALID)
);
// The trimmed string is re-validated as an enum member, so the output type is `EnumHttpMethod`.
const permissionMethodSchema = pipe(
  requiredTrimmed(VALIDATION_ERROR_MESSAGE.PERMISSION_METHOD_IS_REQUIRED),
  enum_(EnumHttpMethod, VALIDATION_ERROR_MESSAGE.PERMISSION_METHOD_INVALID)
);
const permissionModuleSchema = pipe(
  requiredTrimmed(VALIDATION_ERROR_MESSAGE.PERMISSION_MODULE_IS_REQUIRED),
  regex(MODULE_TAG_REGEX, VALIDATION_ERROR_MESSAGE.PERMISSION_MODULE_INVALID)
);

export const PermissionIdParamsSchema = requestObject({
  permissionId: idSchema({
    required: VALIDATION_ERROR_MESSAGE.PERMISSION_ID_IS_REQUIRED,
    invalid: VALIDATION_ERROR_MESSAGE.PERMISSION_ID_INVALID,
    format: VALIDATION_ERROR_MESSAGE.PERMISSION_ID_INVALID
  })
});

export const CreatePermissionBodySchema = requestObject({
  name: permissionNameSchema,
  description: permissionDescriptionSchema,
  path: permissionPathSchema,
  method: permissionMethodSchema,
  module: permissionModuleSchema
});

export const UpdatePermissionBodySchema = requestObject({
  name: optional(permissionNameSchema),
  description: optional(permissionDescriptionSchema),
  path: optional(permissionPathSchema),
  method: optional(permissionMethodSchema),
  module: optional(permissionModuleSchema)
});
