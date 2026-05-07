import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { ROLE_NAME_REGEX } from '@/modules/common/constants/regex.constants';
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
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: pipe(string(), minLength(1), maxLength(64), regex(ROLE_NAME_REGEX)),
  description: string(),
  is_active: boolean(),
  created_at: date(),
  updated_at: date(),
  permission_ids: optional(array(pipe(string(), minLength(ENTITY_ID_LENGTH))), [])
});

export type RoleModel = InferOutput<typeof roleSchema>;

export type RolePermissionModel = {
  role_id: string;
  permission_id: string;
  position: number;
};
