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
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: pipe(string(), minLength(1), maxLength(64), regex(ROLE_NAME_REGEX)),
  description: string(),
  is_active: boolean(),
  permission_ids: optional(array(pipe(string(), minLength(ENTITY_ID_LENGTH))), []),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
});

export type RoleModel = InferOutput<typeof roleSchema>;

export type RolePermissionModel = {
  role_id: string;
  permission_id: string;
  position: number;
};
