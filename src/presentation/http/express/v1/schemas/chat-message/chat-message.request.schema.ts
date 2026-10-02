import { requestObject } from '@/presentation/http/express/utils/schema.util';
import { array, number, object, optional, pipe, string, trim } from 'valibot';

/** Attachment items use `object()` so extra keys from the upload response are stripped, not rejected. */
const chatAttachmentSchema = object({
  key: string(),
  mime: string(),
  size: number(),
  url: optional(string())
});

export const SendChatMessageBodySchema = requestObject({
  text: optional(pipe(string(), trim())),
  attachments: optional(array(chatAttachmentSchema))
});

export const MarkChatReadBodySchema = requestObject({
  lastReadMessageId: optional(pipe(string(), trim()))
});
