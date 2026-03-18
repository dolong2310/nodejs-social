export const VALIDATION_ERROR_MESSAGE = {
  // Auth errors
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100 characters',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password length must be from 6 to 50 characters',
  PASSWORD_MUST_BE_STRONG:
    'Password must be at least 6 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Confirm password length must be from 6 to 50 characters',
  CONFIRM_PASSWORD_MUST_BE_STRONG:
    'Confirm password must be at least 6 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 symbol',
  CONFIRM_PASSWORD_MUST_MATCH_PASSWORD: 'Confirm password does not match password',
  DATE_OF_BIRTH_IS_REQUIRED: 'Date of birth is required',
  DATE_OF_BIRTH_MUST_BE_ISO8601: 'Date of birth must be ISO8601 format',
  EMAIL_AND_PASSWORD_ARE_REQUIRED: 'Email and password are required',

  // Token errors
  TOKEN_MUST_BE_STRING: 'Token must be a string',
  TOKEN_IS_REQUIRED: 'Token is required',
  TOKEN_IS_INVALID: 'Token is invalid',
  NO_TOKEN_PROVIDED: 'No token provided',
  TOKEN_HAS_EXPIRED: 'Token has expired',

  // User errors
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_VERIFIED: 'User already verified',
  USER_NOT_VERIFIED_YET: 'User not verified yet',
  USER_IS_BANNED: 'User is banned',
  BIO_MUST_BE_A_STRING: 'Bio must be a string',
  BIO_LENGTH_MUST_BE_FROM_1_TO_500: 'Bio length must be from 1 to 500 characters',
  LOCATION_MUST_BE_A_STRING: 'Location must be a string',
  LOCATION_LENGTH_MUST_BE_FROM_1_TO_500: 'Location length must be from 1 to 500 characters',
  WEBSITE_MUST_BE_A_STRING: 'Website must be a string',
  WEBSITE_LENGTH_MUST_BE_FROM_1_TO_500: 'Website length must be from 1 to 500 characters',
  USERNAME_MUST_BE_A_STRING: 'Username must be a string',
  USERNAME_LENGTH_MUST_BE_FROM_4_TO_15: 'Username length must be from 4 to 15 characters',
  IMAGE_MUST_BE_A_STRING: 'Image must be a string',
  IMAGE_LENGTH_MUST_BE_FROM_1_TO_500: 'Image length must be from 1 to 500 characters',
  USER_ID_IS_REQUIRED: 'User ID is required',
  USER_ID_MUST_BE_A_STRING: 'User ID must be a string',
  INVALID_USER_ID: 'Invalid user ID',
  USERNAME_MUST_BE_4_TO_15_CHARACTERS_LONG_AND_CONTAIN_ONLY_LETTERS_NUMBERS_AND_UNDERSCORES:
    'Username must be 4 to 15 characters long and contain only letters, numbers and underscores',
  USERNAME_ALREADY_EXISTS: 'Username already exists',

  // Follow errors
  YOU_CANNOT_FOLLOW_YOURSELF: 'You cannot follow yourself',

  // Post errors
  INVALID_POST_TYPE: 'Invalid post type',
  INVALID_POST_AUDIENCE: 'Invalid post audience',
  CONTENT_IS_REQUIRED: 'Content is required',
  CONTENT_MUST_BE_A_STRING: 'Content must be a string',
  CONTENT_MUST_BE_EMPTY_STRING: 'Content must be empty string',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non-empty string',
  CONTENT_LENGTH_MUST_BE_FROM_1_TO_1000: 'Content length must be from 1 to 1000 characters',
  PARENT_ID_IS_REQUIRED: 'Parent ID is required',
  PARENT_ID_MUST_BE_A_VALID_POST_ID: 'Parent ID must be a valid post ID',
  PARENT_ID_MUST_BE_NULL: 'Parent ID must be null',
  HASHTAGS_MUST_BE_AN_ARRAY: 'Hashtags must be an array',
  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRINGS: 'Hashtags must be an array of strings',
  MENTIONS_MUST_BE_AN_ARRAY: 'Mentions must be an array',
  MENTIONS_MUST_BE_AN_ARRAY_OF_VALID_USER_IDS: 'Mentions must be an array of valid user IDs',
  MEDIA_MUST_BE_AN_ARRAY: 'Media must be an array',
  MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS: 'Media must be an array of valid media items',
  ONLY_OWNER_CAN_VIEW_POSTS: 'Only owner can view posts',
  ONLY_FOLLOWERS_CAN_VIEW_POSTS: 'Only followers can view posts',

  // Bookmark errors
  POST_ID_IS_REQUIRED: 'Post ID is required',
  POST_ID_MUST_BE_A_STRING: 'Post ID must be a string',
  INVALID_POST_ID: 'Invalid post ID',
  POST_NOT_FOUND: 'Post not found',

  LIMIT_MUST_BE_BETWEEN_1_TO_100: 'Limit must be between 1 and 100',
  PAGE_MUST_BE_GREATER_THAN_0: 'Page must be greater than 0',

  // Search errors
  SEARCH_QUERY_MUST_BE_A_STRING: 'Search query must be a string',
  MEDIA_TYPE_MUST_BE_ONE_OF_THE_FOLLOWING: 'Media type must be one of the following: image, video, video_hls',
  PEOPLE_FOLLOW_MUST_BE_ONE_OF_THE_FOLLOWING:
    'People follow must be one of the following: following, not_following, only_me',

  // Conversation errors
  INVALID_RECEIVER_ID: 'Invalid receiver ID'
} as const;

export const RATE_LIMIT_ERROR_MESSAGE = {
  TOO_MANY_AUTHENTICATION_ATTEMPTS: 'Too many authentication attempts, please try again later.',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later.'
} as const;

export type VALIDATION_ERROR_MESSAGE_TYPE = (typeof VALIDATION_ERROR_MESSAGE)[keyof typeof VALIDATION_ERROR_MESSAGE];
export type RATE_LIMIT_ERROR_MESSAGE_TYPE = (typeof RATE_LIMIT_ERROR_MESSAGE)[keyof typeof RATE_LIMIT_ERROR_MESSAGE];
