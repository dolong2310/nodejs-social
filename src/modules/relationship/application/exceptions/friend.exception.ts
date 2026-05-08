import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class NoPendingFriendRequestException extends ExceptionBase {
  readonly code = 'FRIEND.NO_PENDING_REQUEST';
  readonly statusCode = 404;
}

export class FriendActionBlockedException extends ExceptionBase {
  readonly code = 'FRIEND.ACTION_BLOCKED';
  readonly statusCode = 403;
}

export class CannotSendFriendRequestToYourselfException extends ExceptionBase {
  readonly code = 'FRIEND.CANNOT_REQUEST_SELF';
  readonly statusCode = 400;
}

export class AlreadyFriendsException extends ExceptionBase {
  readonly code = 'FRIEND.ALREADY_FRIENDS';
  readonly statusCode = 409;
}

export class FriendRequestDailyLimitExceededException extends ExceptionBase {
  readonly code = 'FRIEND.DAILY_LIMIT_EXCEEDED';
  readonly statusCode = 429;
}

export class NoFriendshipWithUserException extends ExceptionBase {
  readonly code = 'FRIEND.NO_FRIENDSHIP';
  readonly statusCode = 403;
}
