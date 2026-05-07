import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { date, type InferOutput, minLength, object, optional, pipe, string } from 'valibot';

export const blockSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  blocker_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  blocked_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  created_at: optional(date(), new Date()),
  updated_at: optional(date(), new Date())
});

export type BlockModel = InferOutput<typeof blockSchema>;
