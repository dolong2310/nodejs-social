import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, minLength, object, pipe, string } from 'valibot';

export const likeSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  post_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  created_at: date(),
  updated_at: date()
});

export type LikeModel = InferOutput<typeof likeSchema>;
