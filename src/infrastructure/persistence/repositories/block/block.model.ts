import { ENTITY_ID_LENGTH } from '@/domain/helpers/ids';
import { date, type InferOutput, minLength, object, optional, pipe, string } from 'valibot';

export const blockSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  blockerId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  blockedId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type BlockModel = InferOutput<typeof blockSchema>;
