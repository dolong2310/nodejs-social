import { ENTITY_ID_LENGTH } from '@/domain/helpers/ids';
import { date, type InferOutput, minLength, object, optional, pipe, string } from 'valibot';

export const bookmarkSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  userId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  postId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type BookmarkModel = InferOutput<typeof bookmarkSchema>;
