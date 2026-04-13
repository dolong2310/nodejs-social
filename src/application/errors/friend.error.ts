import { VALIDATION_ERROR_MESSAGE } from '@/application/common/constants/message.constant';
import { SharedUserNotFoundException } from '@/application/errors/common/user.error';
import { SharedInvalidCursorException } from '@/application/errors/pagination.error';
import {
  BadRequestError,
  ConflictRequestError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError
} from '@/presentation/http/responses/error.response';

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
