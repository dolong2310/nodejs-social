import { EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, nullable, enum_, minLength, object, pipe, string } from 'valibot';

export const permissionSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  description: string(),
  path: string(),
  method: enum_(EnumHttpMethod),
  module: string(),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
});

export type PermissionModel = InferOutput<typeof permissionSchema>;
