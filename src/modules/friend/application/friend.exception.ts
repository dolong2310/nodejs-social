export const NoPendingFriendRequestException = new Error('No pending friend request found');
export const FriendActionBlockedException = new Error('Cannot perform this action because of a block between users');
export const CannotSendFriendRequestToYourselfException = new Error('You cannot send a friend request to yourself');
export const AlreadyFriendsException = new Error('You are already friends with this user');
export const FriendRequestDailyLimitExceededException = new Error(
  'Daily limit for outgoing friend requests reached (100 per UTC day)'
);
export const NoFriendshipWithUserException = new Error('You are not friends with this user');
