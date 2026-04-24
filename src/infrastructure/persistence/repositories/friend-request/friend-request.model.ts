import { ENTITY_ID_LENGTH } from '@/domain/helpers/ids';
import { type InferOutput, date, minLength, object, optional, pipe, string } from 'valibot';

export const friendRequestSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  fromUserId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  toUserId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type FriendRequestModel = InferOutput<typeof friendRequestSchema>;
