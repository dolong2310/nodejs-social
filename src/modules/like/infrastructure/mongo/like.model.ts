import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, minLength, object, optional, pipe, string } from 'valibot';

export const likeSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  userId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  postId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type LikeModel = InferOutput<typeof likeSchema>;
