import { ROLE_NAME_REGEX } from '@/modules/common/constants/regex.constants';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { DomainPrimitive, ValueObject } from '@/modules/core/domain/value-objects/value-object.base';

export class RoleName extends ValueObject<string> {
  constructor(value: string) {
    super({ value: RoleName.normalize(value) });
  }

  static create(value: string): RoleName {
    return new RoleName(value);
  }

  static normalize(value: string): string {
    return typeof value === 'string' ? value.trim().toUpperCase() : value;
  }

  get value(): string {
    return this.raw();
  }

  protected validate(props: DomainPrimitive<string>): void {
    const { value } = props;
    invariant(typeof value === 'string', new ArgumentInvalidException('Role name must be a string'));
    invariant(value.trim().length > 0, new ArgumentNotProvidedException('Role name is required'));
    invariant(
      ROLE_NAME_REGEX.test(value),
      new ArgumentInvalidException('Role name must only contain uppercase letters, digits, or underscores')
    );
  }
}
