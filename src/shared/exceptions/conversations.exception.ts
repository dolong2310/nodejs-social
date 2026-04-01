import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { ForbiddenError, NotFoundError } from '@/providers/httpResponses/error.response';

export const SharedConversationNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
export const SharedConversationNotMemberException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_MEMBER
);
