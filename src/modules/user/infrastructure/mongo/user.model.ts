import { EUserStatus } from '@/modules/user/domain/entities/user.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, object, optional, pipe, string } from 'valibot';

export const userSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  email: string(),
  password: string(),
  birthday: date(),
  role_id: string(),
  status: enum_(EUserStatus),
  totp_secret: optional(string()),
  bio: optional(string()),
  location: optional(string()),
  website: optional(string()),
  username: optional(string()),
  avatar: optional(string()),
  cover_photo: optional(string()),
  created_at: optional(date(), new Date()),
  updated_at: optional(date(), new Date())
});

export type UserModel = InferOutput<typeof userSchema>;
