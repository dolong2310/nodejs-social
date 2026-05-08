import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, minLength, object, optional, pipe, string } from 'valibot';

export const refreshTokenSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  token: string(),
  expires_at: date(),
  created_at: optional(date(), new Date()),
  updated_at: optional(date(), new Date())
});

export type RefreshTokenModel = InferOutput<typeof refreshTokenSchema>;
