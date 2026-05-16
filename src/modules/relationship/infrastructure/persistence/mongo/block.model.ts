import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { date, nullable, type InferOutput, minLength, object, optional, pipe, string } from 'valibot';

export const blockSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  blocker_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  blocked_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  created_at: optional(date(), new Date()),
  created_by_id: optional(nullable(string(), null), null),
  updated_at: optional(date(), new Date()),
  updated_by_id: optional(nullable(string(), null), null),
  deleted_at: optional(nullable(date(), null), null),
  deleted_by_id: optional(nullable(string(), null), null)
});

export type BlockModel = InferOutput<typeof blockSchema>;
