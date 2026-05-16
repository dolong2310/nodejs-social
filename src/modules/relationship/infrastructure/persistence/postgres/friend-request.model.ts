import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, nullable, minLength, object, pipe, string } from 'valibot';

export const friendRequestSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  from_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  to_user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  created_at: date(),
  created_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  updated_at: date(),
  updated_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null),
  deleted_at: nullable(date(), null),
  deleted_by_id: nullable(pipe(string(), minLength(ENTITY_ID_LENGTH)), null)
});

export type FriendRequestModel = InferOutput<typeof friendRequestSchema>;
