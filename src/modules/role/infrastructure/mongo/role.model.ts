import { ROLE_NAME_PATTERN } from '@/modules/role/domain/entities/role.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import {
  type InferOutput,
  array,
  boolean,
  date,
  maxLength,
  minLength,
  object,
  optional,
  pipe,
  regex,
  string
} from 'valibot';

export const roleSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: pipe(string(), minLength(1), maxLength(64), regex(ROLE_NAME_PATTERN)),
  description: optional(string(), ''),
  isActive: boolean(),
  permissionIds: optional(array(pipe(string(), minLength(ENTITY_ID_LENGTH))), []),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type RoleModel = InferOutput<typeof roleSchema>;
