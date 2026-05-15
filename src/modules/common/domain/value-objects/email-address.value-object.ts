import { EMAIL_REGEX } from '@/modules/common/constants/regex.constants';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { DomainPrimitive, ValueObject } from '@/modules/core/domain/value-objects/value-object.base';

export class EmailAddress extends ValueObject<string> {
  constructor(value: string) {
    super({ value: EmailAddress.normalize(value) });
  }

  static create(value: string): EmailAddress {
    return new EmailAddress(value);
  }

  static normalize(value: string): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : value;
  }

  get value(): string {
    return this.raw();
  }

  protected validate(props: DomainPrimitive<string>): void {
    const { value } = props;
    invariant(typeof value === 'string', new ArgumentInvalidException('Email must be a string'));
    invariant(value.trim().length > 0, new ArgumentNotProvidedException('Email is required'));
    invariant(EMAIL_REGEX.test(value), new ArgumentInvalidException('Invalid email format'));
  }
}
