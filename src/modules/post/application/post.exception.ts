import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class PostNotFoundException extends ExceptionBase {
  readonly code = 'POST.NOT_FOUND';
  readonly statusCode = 404;
}

export class GuestCannotAccessNonPublicPostException extends ExceptionBase {
  readonly code = 'POST.GUEST_ACCESS_DENIED';
  readonly statusCode = 401;
}

export class OnlyOwnerCanViewPostsException extends ExceptionBase {
  readonly code = 'POST.ONLY_OWNER_CAN_VIEW';
  readonly statusCode = 403;
}

export class CannotViewPostBlockedException extends ExceptionBase {
  readonly code = 'POST.VIEW_BLOCKED';
  readonly statusCode = 403;
}

export class CannotEngagePostBlockedException extends ExceptionBase {
  readonly code = 'POST.ENGAGE_BLOCKED';
  readonly statusCode = 403;
}

export class OnlyFriendsCanViewPostsException extends ExceptionBase {
  readonly code = 'POST.ONLY_FRIENDS_CAN_VIEW';
  readonly statusCode = 403;
}

export class StrangerCommentsNotAllowedException extends ExceptionBase {
  readonly code = 'POST.STRANGER_COMMENTS_NOT_ALLOWED';
  readonly statusCode = 403;
}

export class CannotEngageWithInaccessiblePostException extends ExceptionBase {
  readonly code = 'POST.ENGAGE_INACCESSIBLE';
  readonly statusCode = 403;
}

export class OnlyOwnerCanUpdatePostSettingsException extends ExceptionBase {
  readonly code = 'POST.ONLY_OWNER_CAN_UPDATE_SETTINGS';
  readonly statusCode = 403;
}
