import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { type InferOutput, date, minLength, object, pipe, string } from 'valibot';

export const blockSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  blocker_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  blocked_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  created_at: date(),
  updated_at: date()
});

export type BlockModel = InferOutput<typeof blockSchema>;
