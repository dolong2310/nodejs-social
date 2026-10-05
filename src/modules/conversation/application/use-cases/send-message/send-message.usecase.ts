import {
  AttachmentTooLargeException,
  ConversationNotFoundException,
  MessageEmptyException,
  MessageForbiddenException
} from '@/modules/conversation/application/exceptions/conversation.exception';
import type { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  type SendMessageInputPort,
  SendMessagePort,
  SendMessageOutputPort
} from '@/modules/conversation/application/use-cases/send-message/send-message.port';
import type { IChatAttachment } from '@/modules/conversation/domain/entities/chat-message.types';
import type { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { EnumConversationType } from '@/modules/conversation/domain/entities/conversation.types';
import type { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import type { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import type { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import type { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';
import type { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import type { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';

/**
 * Overall workflow:
 * This represents one user sending a message in a conversation:
 * - The server verifies the sender is allowed.
 * - Validate content, persist the message, and update the conversation.
 * - Push realtime events to everyone in the room.
 * - Create notifications for recipients.
 */
export class SendMessageUseCase extends SendMessagePort {
  private readonly CHAT_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly chatMessageRepository: ChatMessageRepositoryPort,
    private readonly blockRepository: BlockRepositoryPort,
    private readonly notificationsService: NotificationServicePort,
    private readonly conversationService: ConversationServicePort,
    private readonly realtimeEmitter: RealtimeEmitterPort
  ) {
    super();
  }

  async execute(input: SendMessageInputPort): Promise<SendMessageOutputPort> {
    const { userId, conversationId, text, attachments } = input;
    // The sender must be a conversation member.
    await this.conversationService.isMember({ conversationId, userId });

    // Conversation must exist in the DB.
    const convEntity = await this.conversationRepository.findConversationById(conversationId);
    if (!convEntity) {
      throw new ConversationNotFoundException();
    }

    // Check whether direct messages can be sent.
    await this.assertCanSend(userId, convEntity);

    // Validate content (text and file attachments); it cannot be empty.
    this.validateAttachments(attachments);

    if ((!text || text.length === 0) && (!attachments || attachments.length === 0)) {
      throw new MessageEmptyException();
    }

    // Save the message to the DB.
    const messageEntity = await this.chatMessageRepository.createMessage({
      conversationId,
      senderId: userId,
      text,
      attachments
    });
    const message = messageEntity.toObject();
    // Update the conversation updatedAt timestamp.
    await this.conversationRepository.touchUpdatedAt(conversationId, { updatedAt: message.createdAt });

    // Load conversation members.
    const membersInConversation = await this.conversationMemberRepository.listMembers(conversationId);
    const memberIds = membersInConversation.map((m) => m.getProps().userId);

    const dto = new SendMessageOutputPort({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: message.text,
      attachments: message.attachments,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    });

    // Push realtime updates to everyone in the room.
    if (this.realtimeEmitter) {
      this.realtimeEmitter.emitMessageCreated(conversationId, memberIds, dto);
    }

    const recipientIds: string[] = [];
    // For direct 1-1 chats, create a notification for the recipient only when not blocked.
    // assertCanSend already called isBlockedEitherWay with the peer, so no need to call it again here.
    if (convEntity.getProps().type === EnumConversationType.DIRECT) {
      recipientIds.push(this.conversationService.getDirectPeerId({ conv: convEntity, userId }));
    } else {
      // For group chats, create notifications for all conversation members except the sender.
      // Load all users with a block edge to sender once, avoiding N isBlockedEitherWay calls in the loop.

      const ids = await this.blockRepository.listUserIdsBlockedInEitherDirection(userId);
      const blockedWithSender = new Set(ids);
      for (const member of membersInConversation) {
        const memberId = member.getProps().userId;
        // If memberId is the sender, do not create a notification.
        if (memberId === userId) continue;
        // If the sender has blocked this member, do not create a notification.
        if (blockedWithSender.has(memberId)) continue;
        // Add this member to the notification recipient list.
        recipientIds.push(memberId);
      }
    }

    // Create notifications when there are recipients.
    if (recipientIds.length > 0) {
      await this.notificationsService.recordNewMessage({
        message: messageEntity,
        senderUserId: userId,
        recipientUserIds: recipientIds
      });
    }

    return dto;
  }

  /**
   * - For direct 1-1 chats, do not allow sending when either side blocked the other.
   * - Why: product rule says block = no continued app conversation. isMember only means "is in the room";
   *   the block rule is an extra layer => 403 CONVERSATION_MESSAGE_FORBIDDEN.
   * - Why only DIRECT in current code: groups can still send in the room despite pairwise blocks; notify/realtime logic handles that separately below.
   */
  private async assertCanSend(userId: string, conv: ConversationEntity) {
    if (conv.getProps().type === EnumConversationType.DIRECT) {
      const peerId = this.conversationService.getDirectPeerId({ conv, userId });
      if (await this.blockRepository.isBlockedEitherWay(userId, peerId)) {
        throw new MessageForbiddenException();
      }
    }
  }

  private validateAttachments(att?: IChatAttachment[]) {
    if (!att?.length) return;
    for (const a of att) {
      if (a.size > this.CHAT_ATTACHMENT_MAX_BYTES) {
        throw new AttachmentTooLargeException();
      }
    }
  }
}
