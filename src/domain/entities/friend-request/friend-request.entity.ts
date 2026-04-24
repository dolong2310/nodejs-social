import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { CreateFriendRequestProps, FriendRequestProps } from '@/domain/entities/friend-request/friend-request.type';

export class FriendRequestEntity extends Entity<FriendRequestProps> {
  static create(createProps: CreateFriendRequestProps) {
    const id = new UniqueEntityID();
    const props: FriendRequestProps = { ...createProps };
    const friendRequest = new FriendRequestEntity({ id, props });
    return friendRequest;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
