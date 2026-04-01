import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import {
  BadRequestError,
  ConflictRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError
} from '@/providers/httpResponses/error.response';
import { SharedInvalidCursorException } from '@/shared/exceptions/cursor.exception';
import { SharedUserNotFoundException } from '@/shared/exceptions/users.exception';

export const CannotSendFriendRequestToYourselfException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CANNOT_SEND_FRIEND_REQUEST_TO_YOURSELF
);
export const FriendUserNotFoundException = SharedUserNotFoundException;
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
export const InvalidCursorException = SharedInvalidCursorException;
export const FriendshipPairRequiresDistinctUserIdsException = new BadRequestError(
  'Friendship pair requires two distinct user ids'
);
