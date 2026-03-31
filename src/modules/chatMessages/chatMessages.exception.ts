import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/providers';

export const ChatAttachmentTooLargeException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_ATTACHMENT_TOO_LARGE);
export const ConversationMessageForbiddenException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_MESSAGE_FORBIDDEN
);
export const ChatConversationNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
export const ChatMessageEmptyException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_MESSAGE_EMPTY);
export const ChatInvalidCursorException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
