import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { CreateFriendshipProps, FriendshipProps } from '@/modules/friend/domain/entities/friendship.type';

export class FriendshipEntity extends Entity<FriendshipProps> {
  static create(createProps: CreateFriendshipProps) {
    const id = new UniqueEntityID(generatePrefixId('friendship'));
    const props: FriendshipProps = { ...createProps };
    const friendship = new FriendshipEntity({ id, props });
    return friendship;
  }

  validate(): void {
    const { userIdLow, userIdHigh } = this.getProps();
    invariant(userIdLow.trim().length > 0, new ArgumentNotProvidedException('userIdLow is required'));
    invariant(userIdHigh.trim().length > 0, new ArgumentNotProvidedException('userIdHigh is required'));
    invariant(userIdLow !== userIdHigh, new ArgumentInvalidException('A friendship cannot be between the same user'));
    invariant(
      userIdLow < userIdHigh,
      new ArgumentInvalidException('userIdLow must be lexicographically less than userIdHigh')
    );
  }
}
