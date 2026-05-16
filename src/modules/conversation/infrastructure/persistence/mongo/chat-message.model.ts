import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { array, date, nullable, type InferOutput, minLength, number, object, optional, pipe, string } from 'valibot';

export const chatMessageSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  conversation_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  sender_id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  text: optional(string()),
  attachments: optional(
    array(
      object({
        key: string(),
        mime: string(),
        size: number(),
        url: optional(string())
      })
    )
  ),
  created_at: optional(date(), new Date()),
  created_by_id: optional(nullable(string(), null), null),
  updated_at: optional(date(), new Date()),
  updated_by_id: optional(nullable(string(), null), null),
  deleted_at: optional(nullable(date(), null), null),
  deleted_by_id: optional(nullable(string(), null), null)
});

export type ChatMessageModel = InferOutput<typeof chatMessageSchema>;
