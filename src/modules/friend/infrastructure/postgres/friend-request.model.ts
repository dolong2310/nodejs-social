import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, minLength, object, pipe, string } from 'valibot';

export const friendRequestSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  from_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  to_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  created_at: date(),
  updated_at: date()
});

export type FriendRequestModel = InferOutput<typeof friendRequestSchema>;
