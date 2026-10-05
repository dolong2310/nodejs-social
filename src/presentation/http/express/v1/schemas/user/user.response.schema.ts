import { EnumUserStatus } from '@/modules/user/domain/entities/user.types';
import { enum_, type InferOutput, object, optional, string } from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

/**
 * Public user shape. `object()` strips every undeclared key (password, totpSecret...).
 */
export const UserResponseSchema = object({
  id: string(),
  name: string(),
  email: string(),
  birthday: responseDateSchema,
  roleId: string(),
  status: enum_(EnumUserStatus),
  bio: optional(string()),
  location: optional(string()),
  website: optional(string()),
  username: optional(string()),
  avatar: optional(string()),
  coverPhoto: optional(string()),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});

export type UserResponse = InferOutput<typeof UserResponseSchema>;
