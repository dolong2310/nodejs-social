import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { ForbiddenError, NotFoundError } from '@/providers';

export const SharedConversationNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
export const SharedConversationNotMemberException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_MEMBER
);
