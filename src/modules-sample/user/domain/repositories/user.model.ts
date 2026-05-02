import { ENTITY_ID_LENGTH } from '@/modules/core/helpers/ids';
import { UserRoles, UserStatus } from '@/modules/user/domain/entities/user.types';
import { type InferOutput, boolean, date, email, enum_, minLength, object, optional, pipe, string } from 'valibot';

export const userSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  email: pipe(string(), email()),
  unverifiedEmail: pipe(string(), email()),
  isEmailVerified: boolean(),
  nickname: string(),
  mobile: string(),
  birthday: string(),
  name: string(),
  avatarUrl: string(),
  role: enum_(UserRoles),
  status: enum_(UserStatus),
  locale: optional(string()),
  gender: optional(string()),
  openPlatform: string(),
  utmCampaign: string(),
  utmMedium: string(),
  utmSource: string(),
  googleId: optional(string()),
  githubId: optional(string()),
  facebookId: optional(string()),
  appleId: optional(string()),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type UserModel = InferOutput<typeof userSchema>;
