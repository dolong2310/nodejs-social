import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, minLength, object, optional, pipe, string } from 'valibot';

export const friendRequestSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  from_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  to_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  created_at: optional(date(), new Date()),
  updated_at: optional(date(), new Date())
});

export type FriendRequestModel = InferOutput<typeof friendRequestSchema>;
