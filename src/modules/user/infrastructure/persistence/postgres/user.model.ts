import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.type';
import { type InferOutput, date, enum_, minLength, nullable, object, optional, pipe, string } from 'valibot';

export const userSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  email: string(),
  password: string(),
  birthday: date(),
  role_id: string(),
  status: enum_(EnumUserStatus),
  totp_secret: optional(nullable(string(), null)),
  bio: optional(nullable(string(), null)),
  location: optional(nullable(string(), null)),
  website: optional(nullable(string(), null)),
  username: optional(nullable(string(), null)),
  avatar: optional(nullable(string(), null)),
  cover_photo: optional(nullable(string(), null)),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
});

export type UserModel = InferOutput<typeof userSchema>;
