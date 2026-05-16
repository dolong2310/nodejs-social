import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, nullable, minLength, object, optional, pipe, string } from 'valibot';

export const friendRequestSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  from_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  to_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  created_at: optional(date(), new Date()),
  created_by_id: optional(nullable(string(), null), null),
  updated_at: optional(date(), new Date()),
  updated_by_id: optional(nullable(string(), null), null),
  deleted_at: optional(nullable(date(), null), null),
  deleted_by_id: optional(nullable(string(), null), null)
});

export type FriendRequestModel = InferOutput<typeof friendRequestSchema>;
