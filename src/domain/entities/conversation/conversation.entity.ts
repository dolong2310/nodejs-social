import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import {
  ConversationProps,
  CreateDirectConversationProps,
  CreateGroupConversationProps
} from '@/domain/entities/conversation/conversation.type';

export class ConversationEntity extends Entity<ConversationProps> {
  static create(createProps: CreateDirectConversationProps | CreateGroupConversationProps) {
    const id = new UniqueEntityID();
    const props: ConversationProps = { ...createProps };
    const conversation = new ConversationEntity({ id, props });
    return conversation;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
