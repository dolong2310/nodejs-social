import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { array, date, type InferOutput, minLength, number, object, optional, pipe, string } from 'valibot';

export const chatMessageSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  conversationId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  senderId: pipe(string(), minLength(ENTITY_ID_LENGTH)),
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
  createdAt: optional(date(), new Date()),
  updatedAt: optional(date(), new Date())
});

export type ChatMessageModel = InferOutput<typeof chatMessageSchema>;
