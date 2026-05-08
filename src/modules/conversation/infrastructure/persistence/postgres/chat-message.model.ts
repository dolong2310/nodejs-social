import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { array, date, type InferOutput, minLength, nullable, number, object, optional, pipe, string } from 'valibot';

export const chatMessageSchema = object({
  id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  conversation_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  sender_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  text: nullable(string(), null),
  attachments: nullable(
    array(
      object({
        key: string(),
        mime: string(),
        size: number(),
        url: optional(string())
      })
    ),
    null
  ),
  created_at: date(),
  updated_at: date()
});

export type ChatMessageModel = InferOutput<typeof chatMessageSchema>;
