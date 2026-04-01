import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BadRequestError, ForbiddenError } from '@/providers/httpResponses/error.response';
import { SharedConversationNotFoundException } from '@/shared/exceptions/conversations.exception';
import { SharedInvalidCursorException } from '@/shared/exceptions/cursor.exception';

export const ChatAttachmentTooLargeException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_ATTACHMENT_TOO_LARGE);
export const ConversationMessageForbiddenException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_MESSAGE_FORBIDDEN
);
export const ChatConversationNotFoundException = SharedConversationNotFoundException;
export const ChatMessageEmptyException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_MESSAGE_EMPTY);
export const ChatInvalidCursorException = SharedInvalidCursorException;
