import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, maxLength, minLength, object, pipe, string } from 'valibot';

export const hashtagSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  name: pipe(string(), minLength(1), maxLength(100)),
  created_at: date(),
  updated_at: date()
});

export type HashtagModel = InferOutput<typeof hashtagSchema>;
