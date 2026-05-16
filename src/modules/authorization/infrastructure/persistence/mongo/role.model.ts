import { ROLE_NAME_REGEX } from '@/modules/common/constants/regex.constants';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import {
  type InferOutput,
  array,
  boolean,
  date,
  nullable,
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
  name: pipe(string(), minLength(1), maxLength(64), regex(ROLE_NAME_REGEX)),
  description: optional(string(), ''),
  is_active: boolean(),
  permission_ids: optional(array(pipe(string(), minLength(ENTITY_ID_LENGTH))), []),
  created_at: optional(date(), new Date()),
  created_by_id: optional(nullable(string(), null), null),
  updated_at: optional(date(), new Date()),
  updated_by_id: optional(nullable(string(), null), null),
  deleted_at: optional(nullable(date(), null), null),
  deleted_by_id: optional(nullable(string(), null), null)
});

export type RoleModel = InferOutput<typeof roleSchema>;
