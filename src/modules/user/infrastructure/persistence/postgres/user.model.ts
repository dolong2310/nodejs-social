import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { EUserStatus } from '@/modules/user/domain/entities/user.type';
import { type InferOutput, date, enum_, minLength, nullable, object, optional, pipe, string } from 'valibot';

export const userSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  email: string(),
  password: string(),
  birthday: date(),
  role_id: string(),
  status: enum_(EUserStatus),
  totp_secret: optional(nullable(string(), null)),
  bio: optional(nullable(string(), null)),
  location: optional(nullable(string(), null)),
  website: optional(nullable(string(), null)),
  username: optional(nullable(string(), null)),
  avatar: optional(nullable(string(), null)),
  cover_photo: optional(nullable(string(), null)),
  created_at: date(),
  updated_at: date()
});

export type UserModel = InferOutput<typeof userSchema>;
