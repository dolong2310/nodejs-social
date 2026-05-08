import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, minLength, object, pipe, string } from 'valibot';

export const friendshipSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id_low: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id_high: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  created_at: date(),
  updated_at: date()
});

export type FriendshipModel = InferOutput<typeof friendshipSchema>;
