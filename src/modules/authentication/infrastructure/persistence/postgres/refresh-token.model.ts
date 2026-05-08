import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, minLength, object, pipe, string } from 'valibot';

export const refreshTokenSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  token: string(),
  expires_at: date(),
  created_at: date(),
  updated_at: date()
});

export type RefreshTokenModel = InferOutput<typeof refreshTokenSchema>;
