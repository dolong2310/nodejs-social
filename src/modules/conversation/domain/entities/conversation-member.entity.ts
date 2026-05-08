import {
  ConversationMemberProps,
  CreateConversationMemberProps,
  EConversationMemberRole
} from '@/modules/conversation/domain/entities/conversation-member.type';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';

export class ConversationMemberEntity extends Entity<ConversationMemberProps> {
  static create(createProps: CreateConversationMemberProps) {
    const id = new UniqueEntityID(generatePrefixId('conversation_member'));
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
    const { conversationId, userId, role, joinedAt } = this.getProps();
    invariant(conversationId.trim().length > 0, new ArgumentNotProvidedException('Conversation ID is required'));
    invariant(userId.trim().length > 0, new ArgumentNotProvidedException('User ID is required'));
    invariant(
      Object.values(EConversationMemberRole).includes(role),
      new ArgumentInvalidException('Invalid conversation member role')
    );
    invariant(joinedAt instanceof Date, new ArgumentInvalidException('Join date must be a valid Date'));
  }
}
