export const SOCKET_ROOM_USER_PREFIX = 'user:';
export const SOCKET_ROOM_CHAT_PREFIX = 'chat:';

export function userRoom(userId: string): string {
  return `${SOCKET_ROOM_USER_PREFIX}${userId}`;
}

export function chatRoom(conversationId: string): string {
  return `${SOCKET_ROOM_CHAT_PREFIX}${conversationId}`;
}

export const SOCKET_CLIENT_CHAT_SUBSCRIBE = 'chat:subscribe';
export const SOCKET_CLIENT_CHAT_UNSUBSCRIBE = 'chat:unsubscribe';
export const SOCKET_CLIENT_CHAT_TYPING = 'chat:typing';

export const SOCKET_SERVER_CHAT_MESSAGE_NEW = 'chat:message:new';
export const SOCKET_SERVER_CHAT_READ_UPDATED = 'chat:read:updated';
export const SOCKET_SERVER_PRESENCE_USER = 'presence:user';
export const SOCKET_SERVER_PRESENCE_CHAT = 'presence:chat';
