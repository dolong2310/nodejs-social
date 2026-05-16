import { EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, nullable, enum_, minLength, object, optional, pipe, string } from 'valibot';

export const permissionSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  description: string(),
  path: string(),
  method: enum_(EnumHttpMethod),
  module: string(),
  created_at: optional(date(), new Date()),
  created_by_id: optional(nullable(string(), null), null),
  updated_at: optional(date(), new Date()),
  updated_by_id: optional(nullable(string(), null), null),
  deleted_at: optional(nullable(date(), null), null),
  deleted_by_id: optional(nullable(string(), null), null)
});

export type PermissionModel = InferOutput<typeof permissionSchema>;
