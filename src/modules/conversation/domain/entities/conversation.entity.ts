import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import {
  ConversationProps,
  CreateDirectConversationProps,
  CreateGroupConversationProps,
  EConversationType
} from '@/modules/conversation/domain/entities/conversation.type';

export class ConversationEntity extends Entity<ConversationProps> {
  static create(createProps: CreateDirectConversationProps | CreateGroupConversationProps) {
    const id = new UniqueEntityID(generatePrefixId('conversation'));
    const props: ConversationProps = { ...createProps };
    const conversation = new ConversationEntity({ id, props });
    return conversation;
  }

  validate(): void {
    const { type, createdBy, name, userIdLow, userIdHigh } = this.getProps();
    invariant(createdBy.trim().length > 0, new ArgumentNotProvidedException('Creator ID is required'));
    invariant(
      Object.values(EConversationType).includes(type),
      new ArgumentInvalidException('Invalid conversation type')
    );
    if (type === EConversationType.DIRECT) {
      invariant(
        userIdLow && userIdLow.trim().length > 0,
        new ArgumentNotProvidedException('userIdLow is required for a direct conversation')
      );
      invariant(
        userIdHigh && userIdHigh.trim().length > 0,
        new ArgumentNotProvidedException('userIdHigh is required for a direct conversation')
      );
      invariant(
        userIdLow !== userIdHigh,
        new ArgumentInvalidException('A direct conversation must be between two different users')
      );
    }
    if (type === EConversationType.GROUP) {
      invariant(name && name.trim().length > 0, new ArgumentNotProvidedException('Group name is required'));
    }
  }
}
