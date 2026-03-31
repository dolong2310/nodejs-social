import { VALIDATION_ERROR_MESSAGE } from '@/constants';
import {
  BadRequestError,
  ConflictRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError
} from '@/providers';

export const CannotSendFriendRequestToYourselfException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CANNOT_SEND_FRIEND_REQUEST_TO_YOURSELF
);
export const FriendUserNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
export const FriendActionBlockedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.FRIEND_ACTION_BLOCKED);
export const AlreadyFriendsException = new ConflictRequestError(VALIDATION_ERROR_MESSAGE.ALREADY_FRIENDS);
export const FriendRequestDailyLimitExceededException = new TooManyRequestsError(
  VALIDATION_ERROR_MESSAGE.FRIEND_REQUEST_DAILY_LIMIT_EXCEEDED
);
export const FriendRequestAlreadyPendingException = new ConflictRequestError(
  VALIDATION_ERROR_MESSAGE.FRIEND_REQUEST_ALREADY_PENDING
);
export const NoPendingFriendRequestException = new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_PENDING_FRIEND_REQUEST);
export const NoFriendshipWithUserException = new NotFoundError(VALIDATION_ERROR_MESSAGE.NO_FRIENDSHIP_WITH_USER);
export const InvalidCursorException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
export const FriendshipPairRequiresDistinctUserIdsException = new BadRequestError(
  'Friendship pair requires two distinct user ids'
);
