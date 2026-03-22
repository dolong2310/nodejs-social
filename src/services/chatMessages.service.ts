import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { MarkChatReadBodyDTO, SendChatMessageBodyDTO } from '@/dtos/requests/chatMessage.request.dto';
import {
  ChatMessageResponseDTO,
  ChatMessagesPageResponseDTO,
  toChatMessageDto
} from '@/dtos/responses/chatMessage.response.dto';
import { EChatType, IChat } from '@/models/schemas/chat.schema';
import { IChatAttachment } from '@/models/schemas/chatMessage.schema';
import { IBlockRepository } from '@/repositories/block.repository';
import { IChatMemberRepository } from '@/repositories/chatMember.repository';
import { IChatRepository } from '@/repositories/chat.repository';
import { ChatMessageRepository, IChatMessageRepository } from '@/repositories/chatMessage.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/responses/error.response';
import { BaseService } from '@/services/base.service';
import { decodeMessageCursor, encodeMessageCursor } from '@/utils/chat-cursor.util';
import { ObjectId } from 'mongodb';

/** Max attachment size per file (D-14) — 5 MiB */
export const CHAT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export interface IChatMessagesService {
  sendMessage(userId: string, chatId: string, body: SendChatMessageBodyDTO): Promise<ChatMessageResponseDTO>;
  listMessages(
    userId: string,
    chatId: string,
    limit: number,
    cursor?: string
  ): Promise<ChatMessagesPageResponseDTO>;
  markRead(userId: string, chatId: string, body: MarkChatReadBodyDTO): Promise<void>;
}

class ChatMessagesService extends BaseService implements IChatMessagesService {
  constructor(
    private readonly chatRepository: IChatRepository,
    private readonly chatMemberRepository: IChatMemberRepository,
    private readonly chatMessageRepository: IChatMessageRepository,
    private readonly blockRepository: IBlockRepository
  ) {
    super();
  }

  private directPeer(chat: IChat, viewer: ObjectId): ObjectId {
    if (chat.type !== EChatType.DIRECT || !chat.userIdLow || !chat.userIdHigh) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_FOUND);
    }
    return chat.userIdLow.equals(viewer) ? chat.userIdHigh! : chat.userIdLow!;
  }

  private async assertMember(chatId: ObjectId, userId: ObjectId) {
    const m = await this.chatMemberRepository.findMembership(chatId, userId);
    if (!m) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_MEMBER);
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

  private async assertCanSend(viewerOid: ObjectId, chat: IChat) {
    if (chat.type === EChatType.DIRECT) {
      const peer = this.directPeer(chat, viewerOid);
      if (await this.blockRepository.isBlockedEitherWay(viewerOid, peer)) {
        throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CHAT_MESSAGE_FORBIDDEN);
      }
    }
  }

  async sendMessage(userId: string, chatId: string, body: SendChatMessageBodyDTO): Promise<ChatMessageResponseDTO> {
    const cid = new ObjectId(chatId);
    const viewerOid = new ObjectId(userId);
    await this.assertMember(cid, viewerOid);
    const chat = await this.chatRepository.findById(cid);
    if (!chat) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_FOUND);
    }
    await this.assertCanSend(viewerOid, chat);

    const text = body.text?.trim();
    const attachments = body.attachments;
    this.validateAttachments(attachments);

    if ((!text || text.length === 0) && (!attachments || attachments.length === 0)) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_MESSAGE_EMPTY);
    }

    const msg = ChatMessageRepository.newOutgoingMessage(cid, viewerOid, text || undefined, attachments);
    await this.chatMessageRepository.insertMessage(msg);
    await this.chatRepository.touchUpdatedAt(cid, msg.createdAt);
    return toChatMessageDto(msg);
  }

  async listMessages(
    userId: string,
    chatId: string,
    limit: number,
    cursor?: string
  ): Promise<ChatMessagesPageResponseDTO> {
    const cid = new ObjectId(chatId);
    const viewerOid = new ObjectId(userId);
    await this.assertMember(cid, viewerOid);

    let before: { createdAt: Date; _id: ObjectId } | undefined;
    if (cursor) {
      try {
        before = decodeMessageCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_INVALID_CURSOR);
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

  async markRead(userId: string, chatId: string, body: MarkChatReadBodyDTO): Promise<void> {
    const cid = new ObjectId(chatId);
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
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.CHAT_NOT_FOUND);
    }

    const at = msg.createdAt;
    await this.chatMemberRepository.updateReadState(cid, viewerOid, messageId, at);
  }
}

export default ChatMessagesService;
