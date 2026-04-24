import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { ChatMessageProps, CreateChatMessageProps } from '@/domain/entities/chat-message/chat-message.type';

export class ChatMessageEntity extends Entity<ChatMessageProps> {
  static create(createProps: CreateChatMessageProps) {
    const id = new UniqueEntityID();
    const props: ChatMessageProps = { ...createProps };
    const chatMessage = new ChatMessageEntity({ id, props });
    return chatMessage;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
