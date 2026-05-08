export interface RealtimeAttachmentPayload {
  key: string;
  mime: string;
  size: number;
  url?: string;
}

export interface RealtimeMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments?: RealtimeAttachmentPayload[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RealtimeEmitterPort {
  emitToUser(userId: string, event: string, data: unknown): void;
  emitMessageCreated(conversationId: string, memberUserIds: string[], message: RealtimeMessagePayload): void;
  emitReadUpdated(
    conversationId: string,
    memberUserIds: string[],
    viewerUserId: string,
    payload: { lastReadMessageId: string; lastReadAt: string }
  ): void;
}
