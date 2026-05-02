import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import {
  ArgumentInvalidException,
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException
} from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { type CreateUserProps, type UserProps, EUserStatus } from '@/modules/user/domain/entities/user.type';

export class UserEntity extends Entity<UserProps> {
  static create(createProps: CreateUserProps) {
    const id = new UniqueEntityID(generatePrefixId('user'));
    const props: UserProps = { status: EUserStatus.ACTIVE, ...createProps };
    const user = new UserEntity({ id, props });
    return user;
  }

  validate(): void {
    const { name, email, password, birthday, roleId, status } = this.getProps();
    invariant(name.trim().length > 0, new ArgumentNotProvidedException('Name is required'));
    invariant(email.trim().length > 0, new ArgumentNotProvidedException('Email is required'));
    invariant(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), new ArgumentInvalidException('Invalid email format'));
    invariant(
      password === undefined || password.trim().length > 0,
      new ArgumentNotProvidedException('Password is required')
    );
    invariant(birthday && birthday instanceof Date, new ArgumentInvalidException('Birthday must be a valid Date'));
    invariant(birthday && birthday < new Date(), new ArgumentOutOfRangeException('Birthday must be in the past'));
    invariant(roleId.trim().length > 0, new ArgumentNotProvidedException('Role ID is required'));
    invariant(Object.values(EUserStatus).includes(status), new ArgumentInvalidException('Invalid user status'));
  }
}
