import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { CreateFriendRequestProps, FriendRequestProps } from '@/modules/friend/domain/entities/friend-request.type';

export class FriendRequestEntity extends Entity<FriendRequestProps> {
  static create(createProps: CreateFriendRequestProps) {
    const id = new UniqueEntityID(generatePrefixId('friend_request'));
    const props: FriendRequestProps = { ...createProps };
    const friendRequest = new FriendRequestEntity({ id, props });
    return friendRequest;
  }

  validate(): void {
    const { fromUserId, toUserId } = this.getProps();
    invariant(fromUserId.trim().length > 0, new ArgumentNotProvidedException('Sender user ID is required'));
    invariant(toUserId.trim().length > 0, new ArgumentNotProvidedException('Recipient user ID is required'));
    invariant(
      fromUserId !== toUserId,
      new ArgumentInvalidException('A user cannot send a friend request to themselves')
    );
  }
}
