import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { CreateFriendshipProps, FriendshipProps } from '@/domain/entities/friendship/friendship.type';

export class FriendshipEntity extends Entity<FriendshipProps> {
  static create(createProps: CreateFriendshipProps) {
    const id = new UniqueEntityID();
    const props: FriendshipProps = { ...createProps };
    const friendship = new FriendshipEntity({ id, props });
    return friendship;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
