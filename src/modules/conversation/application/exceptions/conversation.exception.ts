import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class ConversationNotFoundException extends ExceptionBase {
  readonly code = 'CONVERSATION.NOT_FOUND';
  readonly type = 'not_found';
}

export class ConversationNotMemberException extends ExceptionBase {
  readonly code = 'CONVERSATION.NOT_MEMBER';
  readonly type = 'forbidden';
}

export class ConversationGroupNeedsMemberException extends ExceptionBase {
  readonly code = 'CONVERSATION.GROUP_NEEDS_MEMBER';
  readonly type = 'invalid_argument';
}

export class ConversationPeerNotFriendException extends ExceptionBase {
  readonly code = 'CONVERSATION.PEER_NOT_FRIEND';
  readonly type = 'forbidden';
}

export class ConversationInvalidPeerException extends ExceptionBase {
  readonly code = 'CONVERSATION.INVALID_PEER';
  readonly type = 'invalid_argument';
}

export class ConversationPeerBlockedException extends ExceptionBase {
  readonly code = 'CONVERSATION.PEER_BLOCKED';
  readonly type = 'forbidden';
}

export class ConversationUserAlreadyMemberException extends ExceptionBase {
  readonly code = 'CONVERSATION.USER_ALREADY_MEMBER';
  readonly type = 'conflict';
}

export class ConversationInviteNotFriendException extends ExceptionBase {
  readonly code = 'CONVERSATION.INVITE_NOT_FRIEND';
  readonly type = 'forbidden';
}

export class ConversationDirectNoKickException extends ExceptionBase {
  readonly code = 'CONVERSATION.DIRECT_NO_KICK';
  readonly type = 'invalid_argument';
}

export class ConversationCannotKickMemberException extends ExceptionBase {
  readonly code = 'CONVERSATION.CANNOT_KICK_MEMBER';
  readonly type = 'forbidden';
}

export class ConversationRoleForbiddenException extends ExceptionBase {
  readonly code = 'CONVERSATION.ROLE_FORBIDDEN';
  readonly type = 'forbidden';
}

export class MessageEmptyException extends ExceptionBase {
  readonly code = 'CONVERSATION.MESSAGE_EMPTY';
  readonly type = 'invalid_argument';
}

export class MessageForbiddenException extends ExceptionBase {
  readonly code = 'CONVERSATION.MESSAGE_FORBIDDEN';
  readonly type = 'forbidden';
}

export class AttachmentTooLargeException extends ExceptionBase {
  readonly code = 'CONVERSATION.ATTACHMENT_TOO_LARGE';
  readonly type = 'too_large';
}
