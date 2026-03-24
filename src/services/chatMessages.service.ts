import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { MarkChatReadBodyDTO, SendChatMessageBodyDTO } from '@/dtos/requests/chatMessage.request.dto';
import {
  ChatMessageResponseDTO,
  ChatMessagesPageResponseDTO,
  toChatMessageDto
} from '@/dtos/responses/chatMessage.response.dto';
import { IChatAttachment } from '@/models/chatMessage.schema';
import { EConversationType, IConversation } from '@/models/conversation.schema';
import { IRealtimeChatEmitter } from '@/ports/realtimeChatEmitter.port';
import { IBlockRepository } from '@/repositories/block.repository';
import { ChatMessageRepository, IChatMessageRepository } from '@/repositories/chatMessage.repository';
import { IConversationRepository } from '@/repositories/conversation.repository';
import { IConversationMemberRepository } from '@/repositories/conversationMember.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/responses/error.response';
import { BaseService } from '@/services/base.service';
import { INotificationsService } from '@/services/notifications.service';
import { decodeMessageCursor, encodeMessageCursor } from '@/utils/conversation-cursor.util';
import { ObjectId } from 'mongodb';

/** Max attachment size per file (D-14) — 5 MiB */
export const CHAT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export interface IChatMessagesService {
  sendMessage(userId: string, conversationId: string, body: SendChatMessageBodyDTO): Promise<ChatMessageResponseDTO>;
  listMessages(
    userId: string,
    conversationId: string,
    limit: number,
    cursor?: string
  ): Promise<ChatMessagesPageResponseDTO>;
  markRead(userId: string, conversationId: string, body: MarkChatReadBodyDTO): Promise<void>;
  bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void;
}

class ChatMessagesService extends BaseService implements IChatMessagesService {
  private realtimeChatEmitter: IRealtimeChatEmitter | null = null;

  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly conversationMemberRepository: IConversationMemberRepository,
    private readonly chatMessageRepository: IChatMessageRepository,
    private readonly blockRepository: IBlockRepository,
    private readonly notificationsService: INotificationsService
  ) {
    super();
  }

  public bindRealtimeChatEmitter(emitter: IRealtimeChatEmitter | null): void {
    this.realtimeChatEmitter = emitter;
  }

  private directPeer(conv: IConversation, viewer: ObjectId): ObjectId {
    if (conv.type !== EConversationType.DIRECT || !conv.userIdLow || !conv.userIdHigh) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
    }
    return conv.userIdLow.equals(viewer) ? conv.userIdHigh! : conv.userIdLow!;
  }

  private async assertMember(conversationId: ObjectId, userId: ObjectId) {
    const m = await this.conversationMemberRepository.findMembership(conversationId, userId);
    if (!m) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_MEMBER);
    }
    return m;
  }

  private validateAttachments(att?: IChatAttachment[]) {
    if (!att?.length) return;
    for (const a of att) {
      if (a.size > CHAT_ATTACHMENT_MAX_BYTES) {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_ATTACHMENT_TOO_LARGE);
      }
    }
  }

  private async assertCanSend(viewerOid: ObjectId, conv: IConversation) {
    if (conv.type === EConversationType.DIRECT) {
      const peer = this.directPeer(conv, viewerOid);
      if (await this.blockRepository.isBlockedEitherWay(viewerOid, peer)) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CONVERSATION_MESSAGE_FORBIDDEN);
      }
    }
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    body: SendChatMessageBodyDTO
  ): Promise<ChatMessageResponseDTO> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    await this.assertMember(cid, viewerOid);
    const conv = await this.conversationRepository.findById(cid);
    if (!conv) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
    }
    await this.assertCanSend(viewerOid, conv);

    const text = body.text?.trim();
    const attachments = body.attachments;
    this.validateAttachments(attachments);

    if ((!text || text.length === 0) && (!attachments || attachments.length === 0)) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_MESSAGE_EMPTY);
    }

    const msg = ChatMessageRepository.newOutgoingMessage(cid, viewerOid, text || undefined, attachments);
    await this.chatMessageRepository.insertMessage(msg);
    await this.conversationRepository.touchUpdatedAt(cid, msg.createdAt);

    const dto = toChatMessageDto(msg);
    const membersForRealtime = await this.conversationMemberRepository.listMembers(cid);
    const memberHexes = membersForRealtime.map((m) => m.userId.toHexString());
    if (this.realtimeChatEmitter) {
      this.realtimeChatEmitter.emitMessageCreated(conversationId, memberHexes, dto);
    }

    const recipientIds: string[] = [];
    if (conv.type === EConversationType.DIRECT) {
      const peer = this.directPeer(conv, viewerOid);
      if (!(await this.blockRepository.isBlockedEitherWay(viewerOid, peer))) {
        recipientIds.push(peer.toHexString());
      }
    } else {
      const members = await this.conversationMemberRepository.listMembers(cid);
      for (const m of members) {
        if (m.userId.equals(viewerOid)) continue;
        if (await this.blockRepository.isBlockedEitherWay(viewerOid, m.userId)) continue;
        recipientIds.push(m.userId.toHexString());
      }
    }
    if (recipientIds.length > 0) {
      await this.notificationsService.recordNewMessage(msg, userId, recipientIds);
    }

    return dto;
  }

  async listMessages(
    userId: string,
    conversationId: string,
    limit: number,
    cursor?: string
  ): Promise<ChatMessagesPageResponseDTO> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    await this.assertMember(cid, viewerOid);

    let before: { createdAt: Date; _id: ObjectId } | undefined;
    if (cursor) {
      try {
        before = decodeMessageCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
      }
    }

    const page = Math.min(100, Math.max(1, limit));
    const rows = await this.chatMessageRepository.findPageBeforeCursor(cid, page + 1, before);
    const hasMore = rows.length > page;
    const slice = rows.slice(0, page);
    const next =
      hasMore && slice.length > 0
        ? encodeMessageCursor(slice[slice.length - 1].createdAt, slice[slice.length - 1]._id)
        : null;

    return {
      messages: slice.map(toChatMessageDto),
      nextCursor: next
    };
  }

  async markRead(userId: string, conversationId: string, body: MarkChatReadBodyDTO): Promise<void> {
    const cid = new ObjectId(conversationId);
    const viewerOid = new ObjectId(userId);
    await this.assertMember(cid, viewerOid);

    let messageId: ObjectId;
    if (body.lastReadMessageId) {
      messageId = new ObjectId(body.lastReadMessageId);
    } else {
      const latest = await this.chatMessageRepository.findPageBeforeCursor(cid, 1, undefined);
      if (!latest.length) {
        return;
      }
      messageId = latest[0]._id;
    }

    const msg = await this.chatMessageRepository.findById(messageId);
    if (!msg || !msg.chatId.equals(cid)) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CONVERSATION_NOT_FOUND);
    }

    const at = msg.createdAt;
    const updated = await this.conversationMemberRepository.updateReadState(cid, viewerOid, messageId, at);
    if (!updated) {
      return;
    }

    if (this.realtimeChatEmitter) {
      const membersForRealtime = await this.conversationMemberRepository.listMembers(cid);
      const memberHexes = membersForRealtime.map((m) => m.userId.toHexString());
      this.realtimeChatEmitter.emitReadUpdated(conversationId, memberHexes, userId, {
        lastReadMessageId: messageId.toHexString(),
        lastReadAt: at.toISOString()
      });
    }
  }
}

export default ChatMessagesService;
