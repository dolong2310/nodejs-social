import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import {
  AuthFailureError,
  BadRequestError,
  ForbiddenError,
  NotFoundError
} from '@/providers/httpResponses/error.response';

export const PostNotFoundException = new NotFoundError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
export const OnlyOwnerCanUpdatePostSettingsException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.ONLY_OWNER_CAN_UPDATE_POST_SETTINGS
);
export const CannotEngagePostBlockedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.CANNOT_ENGAGE_POST_BLOCKED);
export const StrangerCommentsNotAllowedException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.STRANGER_COMMENTS_NOT_ALLOWED_ON_THIS_POST
);
export const CannotEngageWithInaccessiblePostException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.CANNOT_ENGAGE_WITH_INACCESSIBLE_POST
);
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
export const OnlyOwnerCanViewPostsException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.ONLY_OWNER_CAN_VIEW_POSTS);
export const OnlyFriendsCanViewPostsException = new ForbiddenError(
  VALIDATION_ERROR_MESSAGE.ONLY_FRIENDS_CAN_VIEW_POSTS
);
export const CannotViewPostBlockedException = new ForbiddenError(VALIDATION_ERROR_MESSAGE.CANNOT_VIEW_POST_BLOCKED);
