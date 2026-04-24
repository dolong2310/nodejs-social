export const PostNotFoundException = new Error('Post not found');
export const CannotEngagePostBlockedException = new Error(
  'You cannot engage with this post because of a block between you and the author'
);
export const OnlyFriendsCanViewPostsException = new Error('Only friends can view posts');
export const StrangerCommentsNotAllowedException = new Error(
  'The author does not allow comments from users who are not friends'
);
export const CannotEngageWithInaccessiblePostException = new Error('You cannot interact with this post');
export const OnlyOwnerCanUpdatePostSettingsException = new Error(
  'Only the post author can update audience or comment settings'
);
