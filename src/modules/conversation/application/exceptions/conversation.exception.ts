import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class ConversationNotFoundException extends ExceptionBase {
  readonly code = 'CONVERSATION.NOT_FOUND';
  readonly statusCode = 404;
}

export class ConversationNotMemberException extends ExceptionBase {
  readonly code = 'CONVERSATION.NOT_MEMBER';
  readonly statusCode = 403;
}

export class ConversationGroupNeedsMemberException extends ExceptionBase {
  readonly code = 'CONVERSATION.GROUP_NEEDS_MEMBER';
  readonly statusCode = 400;
}

export class ConversationPeerNotFriendException extends ExceptionBase {
  readonly code = 'CONVERSATION.PEER_NOT_FRIEND';
  readonly statusCode = 403;
}

export class ConversationInvalidPeerException extends ExceptionBase {
  readonly code = 'CONVERSATION.INVALID_PEER';
  readonly statusCode = 400;
}

export class ConversationPeerBlockedException extends ExceptionBase {
  readonly code = 'CONVERSATION.PEER_BLOCKED';
  readonly statusCode = 403;
}

export class ConversationUserAlreadyMemberException extends ExceptionBase {
  readonly code = 'CONVERSATION.USER_ALREADY_MEMBER';
  readonly statusCode = 409;
}

export class ConversationInviteNotFriendException extends ExceptionBase {
  readonly code = 'CONVERSATION.INVITE_NOT_FRIEND';
  readonly statusCode = 403;
}

export class ConversationDirectNoKickException extends ExceptionBase {
  readonly code = 'CONVERSATION.DIRECT_NO_KICK';
  readonly statusCode = 400;
}

export class ConversationCannotKickMemberException extends ExceptionBase {
  readonly code = 'CONVERSATION.CANNOT_KICK_MEMBER';
  readonly statusCode = 403;
}

export class ConversationRoleForbiddenException extends ExceptionBase {
  readonly code = 'CONVERSATION.ROLE_FORBIDDEN';
  readonly statusCode = 403;
}

export class MessageEmptyException extends ExceptionBase {
  readonly code = 'CONVERSATION.MESSAGE_EMPTY';
  readonly statusCode = 400;
}

export class MessageForbiddenException extends ExceptionBase {
  readonly code = 'CONVERSATION.MESSAGE_FORBIDDEN';
  readonly statusCode = 403;
}

export class AttachmentTooLargeException extends ExceptionBase {
  readonly code = 'CONVERSATION.ATTACHMENT_TOO_LARGE';
  readonly statusCode = 413;
}
