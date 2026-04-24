import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import {
  ConversationMemberProps,
  CreateConversationMemberProps
} from '@/domain/entities/conversation-member/conversation-member.type';

export class ConversationMemberEntity extends Entity<ConversationMemberProps> {
  static create(createProps: CreateConversationMemberProps) {
    const id = new UniqueEntityID();
    const props: ConversationMemberProps = {
      ...createProps,
      joinedAt: createProps.joinedAt ?? new Date(),
      lastReadAt: createProps.lastReadAt ?? new Date(),
      lastReadMessageId: createProps.lastReadMessageId ?? null
    };
    const conversationMember = new ConversationMemberEntity({ id, props });
    return conversationMember;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
