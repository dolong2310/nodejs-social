import { AggregateRoot } from '@/modules/core/domain-base/entities/aggregate.base';
import { UniqueEntityID } from '@/modules/core/domain-base/entities/unique-entity';
import { type CreateUserProps, type UserProps, UserRoles, UserStatus } from '@/modules/user/domain/entities/user.types';
import { UserCreatedDomainEvent } from '@/modules/user/domain/events/user-created.event';

export class UserEntity extends AggregateRoot<UserProps> {
  static create(createProps: CreateUserProps) {
    const id = new UniqueEntityID();
    const props: UserProps = { role: UserRoles.MEMBER, status: UserStatus.ACTIVE, ...createProps };
    const user = new UserEntity({ id, props });
    user.addEvent(
      new UserCreatedDomainEvent({
        aggregateId: id,
        ...props,
        ...props?.metadata?.raw(),
        ...props?.provider?.raw()
      })
    );
    return user;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
