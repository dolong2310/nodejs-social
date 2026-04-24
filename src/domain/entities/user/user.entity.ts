import { Entity } from '@/domain/entities/base/base.entity';
import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { type CreateUserProps, type UserProps, EUserStatus } from '@/domain/entities/user/user.type';

export class UserEntity extends Entity<UserProps> {
  static create(createProps: CreateUserProps) {
    const id = new UniqueEntityID();
    const props: UserProps = { status: EUserStatus.ACTIVE, ...createProps };
    const user = new UserEntity({ id, props });
    return user;
  }

  validate(): void {
    throw new Error('Method not implemented.');
  }
}
