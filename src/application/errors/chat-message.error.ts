import { VALIDATION_ERROR_MESSAGE } from '@/application/common/constants/message.constant';
import { SharedConversationNotFoundException } from '@/application/errors/common/conversation.error';
import { SharedInvalidCursorException } from '@/application/errors/pagination.error';
import { BadRequestError, ForbiddenError } from '@/presentation/http/responses/error.response';

export const ChatAttachmentTooLargeException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_ATTACHMENT_TOO_LARGE);
export const ConversationMessageForbiddenException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_MESSAGE_FORBIDDEN
);
export const ChatConversationNotFoundException = SharedConversationNotFoundException;
export const ChatMessageEmptyException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_MESSAGE_EMPTY);
export const ChatInvalidCursorException = SharedInvalidCursorException;
