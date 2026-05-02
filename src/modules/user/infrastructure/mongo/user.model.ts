import { EUserStatus } from '@/modules/user/domain/entities/user.type';
import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, enum_, minLength, object, optional, pipe, string } from 'valibot';

export const userSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: string(),
  email: string(),
  password: string(),
  birthday: date(),
  roleId: string(),
  status: enum_(EUserStatus),
  totpSecret: optional(string()),
  bio: optional(string()),
  location: optional(string()),
  website: optional(string()),
  username: optional(string()),
  avatar: optional(string()),
  coverPhoto: optional(string()),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type UserModel = InferOutput<typeof userSchema>;
