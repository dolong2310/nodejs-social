import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constant';
import {
  AuthFailureError,
  BadRequestError,
  ForbiddenError,
  NotFoundError
} from '@/presentation/http/express/responses/error.response';

export const PostNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
export const PostContentMustBeEmptyStringException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_EMPTY_STRING
);
export const PostContentMustBeNonEmptyStringException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING
);
export const ParentIdMustBeValidPostIdException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_A_VALID_POST_ID
);
export const ParentIdMustBeNullException = new BadRequestError(VALIDATION_ERROR_MESSAGE.PARENT_ID_MUST_BE_NULL);
export const HashtagsMustBeArrayOfStringsException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRINGS
);
export const HashtagsCountMustBeBetween0To20Exception = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.HASHTAGS_COUNT_MUST_BE_BETWEEN_0_TO_20
);
export const MentionsMustBeArrayOfValidUserIdsException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_VALID_USER_IDS
);
export const MediaMustBeArrayOfValidItemsException = new BadRequestError(
  VALIDATION_ERROR_MESSAGE.MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS
);
export const InvalidPostIdException = new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_POST_ID);
export const GuestCannotAccessNonPublicPostException = new AuthFailureError();
export const OnlyFriendsCanViewPostsException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.ONLY_FRIENDS_CAN_VIEW_POSTS
);
export const CannotViewPostBlockedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.CANNOT_VIEW_POST_BLOCKED);
