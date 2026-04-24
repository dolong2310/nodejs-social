import { ERoleName } from '@/domain/entities/role/role.type';
import { ENTITY_ID_LENGTH } from '@/domain/helpers/ids';
import { type InferOutput, array, boolean, date, enum_, minLength, object, optional, pipe, string } from 'valibot';

export const roleSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: enum_(ERoleName),
  description: optional(string(), ''),
  isActive: boolean(),
  permissionIds: optional(array(pipe(string(), minLength(ENTITY_ID_LENGTH))), []),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type RoleModel = InferOutput<typeof roleSchema>;
