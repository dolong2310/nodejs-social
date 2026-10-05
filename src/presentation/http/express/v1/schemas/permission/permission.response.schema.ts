import { EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.types';
import { enum_, type InferOutput, object, string } from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

export const PermissionResponseSchema = object({
  id: string(),
  name: string(),
  description: string(),
  path: string(),
  method: enum_(EnumHttpMethod),
  module: string(),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});
export type PermissionResponse = InferOutput<typeof PermissionResponseSchema>;
