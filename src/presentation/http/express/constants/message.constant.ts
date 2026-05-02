export const APP_ERROR_MESSAGE = {
  CONTAINER_INSTANCE_NOT_INITIALIZED: 'Container has not been initialized. Call Container.getOrSet() during bootstrap.'
} as const;

export const VALIDATION_ERROR_MESSAGE = {
  // Auth errors
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100 characters',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid', // TODO: remove if needed
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
  EMAIL_AND_PASSWORD_ARE_REQUIRED: 'Email and password are required', // TODO: remove if needed

  // Token errors
  TOKEN_MUST_BE_STRING: 'Token must be a string', // TODO: remove if needed
  TOKEN_IS_REQUIRED: 'Token is required', // TODO: remove if needed
  TOKEN_IS_INVALID: 'Token is invalid',
  NO_TOKEN_PROVIDED: 'No token provided',
  TOKEN_HAS_EXPIRED: 'Token has expired',
  ADMIN_ROLE_REQUIRED: 'This action requires an administrator account',

  // User errors
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password', // TODO: remove if needed
  USER_NOT_FOUND: 'User not found',
  USER_IS_INACTIVE: 'User is inactive',
  USER_IS_BANNED: 'User is banned',
  BIO_MUST_BE_A_STRING: 'Bio must be a string',
  BIO_LENGTH_MUST_BE_FROM_1_TO_500: 'Bio length must be from 1 to 500 characters',
  LOCATION_MUST_BE_A_STRING: 'Location must be a string',
  LOCATION_LENGTH_MUST_BE_FROM_1_TO_500: 'Location length must be from 1 to 500 characters',
  WEBSITE_MUST_BE_A_STRING: 'Website must be a string',
  WEBSITE_LENGTH_MUST_BE_FROM_1_TO_500: 'Website length must be from 1 to 500 characters',
  USERNAME_MUST_BE_A_STRING: 'Username must be a string',
  USERNAME_LENGTH_MUST_BE_FROM_4_TO_15: 'Username length must be from 4 to 15 characters', // TODO: remove if needed
  IMAGE_MUST_BE_A_STRING: 'Image must be a string',
  IMAGE_LENGTH_MUST_BE_FROM_1_TO_500: 'Image length must be from 1 to 500 characters',
  USER_ID_IS_REQUIRED: 'User ID is required',
  USER_ID_MUST_BE_A_STRING: 'User ID must be a string',
  INVALID_USER_ID: 'Invalid user ID',
  USERNAME_MUST_BE_4_TO_15_CHARACTERS_LONG_AND_CONTAIN_ONLY_LETTERS_NUMBERS_AND_UNDERSCORES:
    'Username must be 4 to 15 characters long and contain only letters, numbers and underscores',
  USERNAME_ALREADY_EXISTS: 'Username already exists',

  // Post errors
  INVALID_POST_TYPE: 'Invalid post type',
  INVALID_POST_AUDIENCE: 'Invalid post audience',
  ALLOW_STRANGER_COMMENTS_MUST_BE_BOOLEAN: 'allowStrangerComments must be a boolean',
  CONTENT_IS_REQUIRED: 'Content is required', // TODO: remove if needed
  CONTENT_MUST_BE_A_STRING: 'Content must be a string',
  CONTENT_MUST_BE_EMPTY_STRING: 'Content must be empty string',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non-empty string',
  CONTENT_LENGTH_MUST_BE_FROM_1_TO_1000: 'Content length must be from 1 to 1000 characters', // TODO: remove if needed
  PARENT_ID_IS_REQUIRED: 'Parent ID is required', // TODO: remove if needed
  PARENT_ID_MUST_BE_A_VALID_POST_ID: 'Parent ID must be a valid post ID',
  PARENT_ID_MUST_BE_NULL: 'Parent ID must be null',
  HASHTAGS_MUST_BE_AN_ARRAY: 'Hashtags must be an array',
  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRINGS: 'Hashtags must be an array of strings',
  HASHTAGS_COUNT_MUST_BE_BETWEEN_0_TO_20: 'Hashtags count must be between 0 and 20',
  MENTIONS_MUST_BE_AN_ARRAY: 'Mentions must be an array',
  MENTIONS_MUST_BE_AN_ARRAY_OF_VALID_USER_IDS: 'Mentions must be an array of valid user IDs',
  MEDIA_MUST_BE_AN_ARRAY: 'Media must be an array',
  MEDIA_MUST_BE_AN_ARRAY_OF_VALID_MEDIA_ITEMS: 'Media must be an array of valid media items',
  ONLY_FRIENDS_CAN_VIEW_POSTS: 'Only friends can view posts',
  CANNOT_VIEW_POST_BLOCKED: 'You cannot view this post because of a block between you and the author',

  // Bookmark errors
  POST_ID_IS_REQUIRED: 'Post ID is required',
  POST_ID_MUST_BE_A_STRING: 'Post ID must be a string',
  INVALID_POST_ID: 'Invalid post ID',
  POST_NOT_FOUND: 'Post not found',

  LIMIT_MUST_BE_BETWEEN_1_TO_100: 'Limit must be between 1 and 100',
  PAGE_MUST_BE_GREATER_THAN_0: 'Page must be greater than 0',

  // Search errors
  SEARCH_QUERY_MUST_BE_A_STRING: 'Search query must be a string',
  MEDIA_TYPE_MUST_BE_ONE_OF_THE_FOLLOWING: 'Media type must be one of the following: image, video, video_stream',
  PEOPLE_MUST_BE_ONE_OF_THE_FOLLOWING: 'People filter must be one of the following: friends, not_friends, only_me',

  // Conversation errors
  CONVERSATION_ID_IS_REQUIRED: 'Conversation ID is required',
  CONVERSATION_ID_MUST_BE_A_STRING: 'Conversation ID must be a string',
  INVALID_CONVERSATION_ID: 'Invalid conversation ID',
  CONVERSATION_ROLE_FORBIDDEN: 'This role change is not allowed',
  CONVERSATION_GROUP_NEEDS_MEMBER: 'Group must include at least one other member',

  // Role errors
  ROLE_ID_IS_REQUIRED: 'Role ID is required',
  ROLE_ID_INVALID: 'Invalid role ID',
  ROLE_NAME_IS_REQUIRED: 'Role name is required',
  ROLE_NAME_INVALID: 'Role name must be 1-64 characters (A-Z, 0-9, _)',
  ROLE_IS_INACTIVE: 'Your role has been deactivated. Access denied.',
  CANNOT_DEACTIVATE_ADMIN_ROLE: 'The ADMIN role cannot be deactivated',

  // Permission errors
  PERMISSION_ID_IS_REQUIRED: 'Permission ID is required',
  PERMISSION_ID_INVALID: 'Invalid permission ID',
  PERMISSION_NAME_IS_REQUIRED: 'Permission name is required',
  PERMISSION_DESCRIPTION_IS_REQUIRED: 'Permission description is required',
  PERMISSION_PATH_IS_REQUIRED: 'Permission path is required',
  PERMISSION_PATH_INVALID: 'Permission path must start with /',
  PERMISSION_METHOD_IS_REQUIRED: 'HTTP method is required',
  PERMISSION_METHOD_INVALID: 'Invalid HTTP method',
  PERMISSION_MODULE_IS_REQUIRED: 'Module tag is required',
  PERMISSION_MODULE_INVALID: 'Module must match pattern [A-Z][A-Z0-9_]* (e.g. POSTS, AUTH)',

  // Media errors
  VIDEO_NOT_FOUND: 'Video not found',

  // OTP errors
  TYPE_IS_REQUIRED: 'Type is required',
  TYPE_IS_INVALID: 'Invalid type',

  // 2FA code errors
  TOTP_CODE_MUST_BE_A_STRING: 'TOTP code must be a string',
  TOTP_CODE_MUST_BE_6_CHARACTERS: 'TOTP code must be exactly 6 characters',
  EMAIL_OTP_CODE_MUST_BE_A_STRING: 'Email OTP code must be a string',
  EMAIL_OTP_CODE_MUST_BE_6_CHARACTERS: 'Email OTP code must be exactly 6 characters',
  ONLY_ONE_OF_TOTP_OR_EMAIL_OTP_REQUIRED:
    'Exactly one of totpCode or emailOtpCode must be provided, not both and not neither',
  TOTP_AND_EMAIL_OTP_CANNOT_BOTH_BE_PROVIDED: 'Only one of totpCode or emailOtpCode can be provided, not both'
} as const;

export const RATE_LIMIT_ERROR_MESSAGE = {
  TOO_MANY_AUTHENTICATION_ATTEMPTS: 'Too many authentication attempts, please try again later.',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later.'
} as const;
