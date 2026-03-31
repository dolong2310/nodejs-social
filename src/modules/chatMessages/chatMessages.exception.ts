import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { BadRequestError, ForbiddenError } from '@/providers';
import { SharedInvalidCursorException } from '@/shared';
import { SharedConversationNotFoundException } from '@/shared/exceptions';

export const ChatAttachmentTooLargeException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_ATTACHMENT_TOO_LARGE);
export const ConversationMessageForbiddenException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_MESSAGE_FORBIDDEN
);
export const ChatConversationNotFoundException = SharedConversationNotFoundException;
export const ChatMessageEmptyException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_MESSAGE_EMPTY);
export const ChatInvalidCursorException = SharedInvalidCursorException;
