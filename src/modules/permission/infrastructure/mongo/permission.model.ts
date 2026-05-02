import { EHttpMethod } from '@/modules/permission/domain/entities/permission.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, object, optional, pipe, string } from 'valibot';

export const permissionSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  description: string(),
  path: string(),
  method: enum_(EHttpMethod),
  module: string(),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type PermissionModel = InferOutput<typeof permissionSchema>;
