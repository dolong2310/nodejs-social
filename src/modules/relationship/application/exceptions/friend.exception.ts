import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class NoPendingFriendRequestException extends ExceptionBase {
  readonly code = 'FRIEND.NO_PENDING_REQUEST';
  readonly type = 'not_found';
}

export class FriendActionBlockedException extends ExceptionBase {
  readonly code = 'FRIEND.ACTION_BLOCKED';
  readonly type = 'forbidden';
}

export class CannotSendFriendRequestToYourselfException extends ExceptionBase {
  readonly code = 'FRIEND.CANNOT_REQUEST_SELF';
  readonly type = 'invalid_argument';
}

export class AlreadyFriendsException extends ExceptionBase {
  readonly code = 'FRIEND.ALREADY_FRIENDS';
  readonly type = 'conflict';
}

export class FriendRequestDailyLimitExceededException extends ExceptionBase {
  readonly code = 'FRIEND.DAILY_LIMIT_EXCEEDED';
  readonly type = 'rate_limited';
}

export class NoFriendshipWithUserException extends ExceptionBase {
  readonly code = 'FRIEND.NO_FRIENDSHIP';
  readonly type = 'forbidden';
}
