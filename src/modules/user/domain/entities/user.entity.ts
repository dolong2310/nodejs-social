import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { Username } from '@/modules/common/domain/value-objects/username.value-object';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import {
  ArgumentInvalidException,
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException
} from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import {
  type CreateUserProps,
  EnumUserStatus,
  type UserFullProps,
  type UserProps
} from '@/modules/user/domain/entities/user.type';

export class UserEntity extends Entity<UserProps, UserFullProps> {
  static create(createProps: CreateUserProps) {
    const id = new UniqueEntityID(generatePrefixId('user'));
    const props: UserProps = {
      status: EnumUserStatus.ACTIVE,
      ...createProps,
      email: EmailAddress.create(createProps.email),
      username: Username.createOptional(createProps.username)
    };
    const user = new UserEntity({ id, props });
    return user;
  }

  validate(): void {
    const { name, email, password, birthday, roleId, status, username } = this.getProps();
    invariant(name.trim().length > 0, new ArgumentNotProvidedException('Name is required'));
    invariant(email instanceof EmailAddress, new ArgumentInvalidException('User email must be an EmailAddress'));
    invariant(
      username === undefined || username instanceof Username,
      new ArgumentInvalidException('Username is invalid')
    );
    invariant(
      password === undefined || password.trim().length > 0,
      new ArgumentNotProvidedException('Password is required')
    );
    invariant(birthday && birthday instanceof Date, new ArgumentInvalidException('Birthday must be a valid Date'));
    invariant(birthday && birthday < new Date(), new ArgumentOutOfRangeException('Birthday must be in the past'));
    invariant(roleId.trim().length > 0, new ArgumentNotProvidedException('Role ID is required'));
    invariant(Object.values(EnumUserStatus).includes(status), new ArgumentInvalidException('Invalid user status'));
  }
}
