import { ConversationNotFoundException } from '@/modules/conversation/application/exceptions/conversation.exception';
import type { ConversationServicePort } from '@/modules/conversation/application/services/conversation.service';
import {
  type MarkReadInputPort,
  MarkReadPort
} from '@/modules/conversation/application/use-cases/mark-read-message/mark-read-message.port';
import type { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import type { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import type { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import type { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';

export class MarkReadUseCase extends MarkReadPort {
  constructor(
    private readonly conversationMemberRepository: ConversationMemberRepositoryPort,
    private readonly chatMessageRepository: ChatMessageRepositoryPort,
    private readonly conversationService: ConversationServicePort,
    private readonly realtimeEmitter: RealtimeEmitterPort
  ) {
    super();
  }

  async execute(input: MarkReadInputPort): Promise<void> {
    const { userId, conversationId, lastReadMessageId } = input;
    // The viewer must be a conversation member.
    await this.conversationService.isMember({ conversationId, userId });

    let messageEntity: ChatMessageEntity;
    let messageId: string;
    if (lastReadMessageId) {
      // The client provides the read messageId, meaning "I have scrolled/read up to this message".
      messageId = lastReadMessageId;
      // Check whether messageId is valid.
      // messageId must exist and belong to conversationId, avoiding deleted messages or messages from another conversation.
      const entity = await this.chatMessageRepository.findMessageById(messageId);
      if (!entity || entity.getProps().conversationId !== conversationId) {
        throw new ConversationNotFoundException();
      }
      messageEntity = entity;
    } else {
      // Load the latest message in the conversation.
      const entities = await this.chatMessageRepository.findMessages(conversationId, { limit: 1, before: undefined });
      const [latest] = entities;
      if (!latest) return;
      messageEntity = latest;
      messageId = messageEntity.id.toString();
      // Check whether messageId is valid.
      // messageId must exist and belong to conversationId, avoiding deleted messages or messages from another conversation.
      if (messageEntity.getProps().conversationId !== conversationId) {
        throw new ConversationNotFoundException();
      }
    }

    // Update the viewer's latest read timestamp.
    const lastReadAt = messageEntity.createdAt;
    // Update the viewer's latest read timestamp in conversationMember.
    const updated = await this.conversationMemberRepository.updateReadState({
      conversationId,
      userId,
      lastReadMessageId: messageId,
      lastReadAt
    });
    if (!updated) return;

    if (this.realtimeEmitter) {
      // Load conversation members.
      const membersInConversation = await this.conversationMemberRepository.listMembers(conversationId);
      const memberIds = membersInConversation.map((m) => m.getProps().userId);
      // Push realtime updates to everyone in the room.
      this.realtimeEmitter.emitReadUpdated(conversationId, memberIds, userId, {
        lastReadMessageId: messageId,
        lastReadAt: lastReadAt.toISOString()
      });
    }
  }
}
