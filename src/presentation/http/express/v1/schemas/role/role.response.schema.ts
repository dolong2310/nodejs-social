import { array, boolean, type InferOutput, object, string } from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

export const RoleResponseSchema = object({
  id: string(),
  name: string(),
  description: string(),
  isActive: boolean(),
  permissionIds: array(string()),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});
export type RoleResponse = InferOutput<typeof RoleResponseSchema>;
