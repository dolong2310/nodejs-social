import { ExceptionBase } from '@/modules/core/domain/exceptions/exception.base';

export class PostNotFoundException extends ExceptionBase {
  readonly code = 'POST.NOT_FOUND';
  readonly type = 'not_found';
}

export class GuestCannotAccessNonPublicPostException extends ExceptionBase {
  readonly code = 'POST.GUEST_ACCESS_DENIED';
  readonly type = 'unauthenticated';
}

export class OnlyOwnerCanViewPostsException extends ExceptionBase {
  readonly code = 'POST.ONLY_OWNER_CAN_VIEW';
  readonly type = 'forbidden';
}

export class CannotViewPostBlockedException extends ExceptionBase {
  readonly code = 'POST.VIEW_BLOCKED';
  readonly type = 'forbidden';
}

export class CannotEngagePostBlockedException extends ExceptionBase {
  readonly code = 'POST.ENGAGE_BLOCKED';
  readonly type = 'forbidden';
}

export class OnlyFriendsCanViewPostsException extends ExceptionBase {
  readonly code = 'POST.ONLY_FRIENDS_CAN_VIEW';
  readonly type = 'forbidden';
}

export class StrangerCommentsNotAllowedException extends ExceptionBase {
  readonly code = 'POST.STRANGER_COMMENTS_NOT_ALLOWED';
  readonly type = 'forbidden';
}

export class CannotEngageWithInaccessiblePostException extends ExceptionBase {
  readonly code = 'POST.ENGAGE_INACCESSIBLE';
  readonly type = 'forbidden';
}

export class OnlyOwnerCanUpdatePostSettingsException extends ExceptionBase {
  readonly code = 'POST.ONLY_OWNER_CAN_UPDATE_SETTINGS';
  readonly type = 'forbidden';
}

export class OnlyOwnerOrAdminCanDeletePostException extends ExceptionBase {
  readonly code = 'POST.ONLY_OWNER_OR_ADMIN_CAN_DELETE';
  readonly type = 'forbidden';
}

export class OnlyRootPostCanBeUpdatedException extends ExceptionBase {
  readonly code = 'POST.ONLY_ROOT_POST_CAN_BE_UPDATED';
  readonly type = 'forbidden';
}

export class RepostCannotBeUpdatedException extends ExceptionBase {
  readonly code = 'POST.REPOST_CANNOT_BE_UPDATED';
  readonly type = 'forbidden';
}

export class EmptyPostUpdateException extends ExceptionBase {
  readonly code = 'POST.EMPTY_UPDATE';
  readonly type = 'invalid_argument';
}
