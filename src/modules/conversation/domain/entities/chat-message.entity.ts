import { ChatMessageProps, CreateChatMessageProps } from '@/modules/conversation/domain/entities/chat-message.type';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';

export class ChatMessageEntity extends Entity<ChatMessageProps> {
  static create(createProps: CreateChatMessageProps) {
    const id = new UniqueEntityID(generatePrefixId('chat_message'));
    const props: ChatMessageProps = { ...createProps };
    const chatMessage = new ChatMessageEntity({ id, props });
    return chatMessage;
  }

  validate(): void {
    const { conversationId, senderId, text, attachments } = this.getProps();
    invariant(conversationId.trim().length > 0, new ArgumentNotProvidedException('Conversation ID is required'));
    invariant(senderId.trim().length > 0, new ArgumentNotProvidedException('Sender ID is required'));
    const hasText = typeof text === 'string' && text.trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
    invariant(
      hasText || hasAttachments,
      new ArgumentInvalidException('Message must contain either text or at least one attachment')
    );
  }
}
