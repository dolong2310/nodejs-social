import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, minLength, object, optional, pipe, string } from 'valibot';

export const hashtagSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: pipe(string(), minLength(1)),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type HashtagModel = InferOutput<typeof hashtagSchema>;
