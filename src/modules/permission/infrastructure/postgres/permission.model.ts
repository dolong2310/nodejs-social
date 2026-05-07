import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { EHttpMethod } from '@/modules/permission/domain/entities/permission.type';
import { type InferOutput, date, enum_, minLength, object, pipe, string } from 'valibot';

export const permissionSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  description: string(),
  path: string(),
  method: enum_(EHttpMethod),
  module: string(),
  created_at: date(),
  updated_at: date()
});

export type PermissionModel = InferOutput<typeof permissionSchema>;
