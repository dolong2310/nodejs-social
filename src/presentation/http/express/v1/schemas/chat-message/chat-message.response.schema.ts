import { array, type InferOutput, number, object, optional, string } from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

export const ChatMessageResponseSchema = object({
  id: string(),
  conversationId: string(),
  senderId: string(),
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
  createdAt: responseDateSchema,
  updatedAt: responseDateSchema
});
export type ChatMessageResponse = InferOutput<typeof ChatMessageResponseSchema>;
