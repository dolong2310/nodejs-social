import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import { BadRequestError, ConflictRequestError, ForbiddenError, NotFoundError } from '@/providers';

export const ConversationNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
export const ConversationInvalidPeerException = new BadRequestError(VALIDATION_ERROR_MESSAGE.CONVERSATION_INVALID_PEER);
export const ConversationPeerNotFriendException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_PEER_NOT_FRIEND
);
export const ConversationPeerBlockedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_PEER_BLOCKED);
export const ConversationGroupNeedsMemberException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_GROUP_NEEDS_MEMBER
);
export const ConversationInvalidCursorException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
export const ConversationRoleForbiddenException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_ROLE_FORBIDDEN
);
export const ConversationTypeInvalidForOperationException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND
);
export const ConversationUserAlreadyMemberException = new ConflictRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_USER_ALREADY_MEMBER
);
export const ConversationInviteNotFriendException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_INVITE_NOT_FRIEND_OF_BOTH
);
export const ConversationDirectNoKickException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_DIRECT_NO_KICK
);
export const ConversationCannotKickException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_CANNOT_KICK);
export const ConversationCannotKickBadRequestException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONVERSATION_CANNOT_KICK
);
export const ConversationNotMemberException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_MEMBER);
export const ConversationTargetUserNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
