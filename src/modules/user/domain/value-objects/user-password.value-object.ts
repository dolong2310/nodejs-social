import { ValueObject } from '@/modules/core/domain-base/entities/value-object.base';
import bcrypt from 'bcrypt';

export interface IUserPassword {
  value: string;
}

export class UserProvider extends ValueObject<IUserPassword> {
  get value() {
    return this.props.value;
  }

  async comparePassword(plainPassword: string) {
    return bcrypt.compare(this.value, plainPassword);
  }

  protected validate(props: IUserPassword): void {}
}
