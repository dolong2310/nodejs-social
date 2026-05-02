export const ConversationNotFoundException = new Error('Conversation not found');
export const ConversationNotMemberException = new Error('You are not a member of this conversation');
export const ConversationGroupNeedsMemberException = new Error('Group must include at least one other member');
export const ConversationPeerNotFriendException = new Error('You can only start a direct conversation with a friend');
export const ConversationInvalidPeerException = new Error('Invalid peer user');
export const ConversationPeerBlockedException = new Error(
  'Cannot use this conversation due to a block between participants'
);
export const ConversationUserAlreadyMemberException = new Error('User is already a member of this conversation');
export const ConversationInviteNotFriendException = new Error(
  'Invited user must be friends with you and with the group creator'
);
export const ConversationDirectNoKickException = new Error('Kick is not supported in direct conversations');
export const ConversationCannotKickMemberException = new Error('You cannot remove this member');
export const ConversationRoleForbiddenException = new Error('This role change is not allowed');

export const MessageEmptyException = new Error('Message must include non-empty text and/or attachments');
export const MessageForbiddenException = new Error('You cannot send messages in this conversation');
export const AttachmentTooLargeException = new Error('Each attachment must be 5MB or less');
