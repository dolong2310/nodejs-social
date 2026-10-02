import { type InferOutput, object, optional, string } from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

/** Minimal public user record (friends, friend requests, blocked users, mentions...). */
export const UserRecordResponseSchema = object({
  id: string(),
  name: string(),
  username: optional(string()),
  avatar: optional(string())
});
export type UserRecordResponse = InferOutput<typeof UserRecordResponseSchema>;

export const FriendRequestResponseSchema = object({
  id: string(),
  fromUserId: string(),
  toUserId: string(),
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});
export type FriendRequestResponse = InferOutput<typeof FriendRequestResponseSchema>;
