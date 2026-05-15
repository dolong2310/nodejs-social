import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { DomainPrimitive, ValueObject } from '@/modules/core/domain/value-objects/value-object.base';

const OTP_CODE_REGEX = /^\d{6}$/;

export class OtpCode extends ValueObject<string> {
  constructor(value: string) {
    super({ value: OtpCode.normalize(value) });
  }

  static create(value: string): OtpCode {
    return new OtpCode(value);
  }

  static normalize(value: string): string {
    return typeof value === 'string' ? value.trim() : value;
  }

  get value(): string {
    return this.raw();
  }

  protected validate(props: DomainPrimitive<string>): void {
    const { value } = props;
    invariant(typeof value === 'string', new ArgumentInvalidException('OTP code must be a string'));
    invariant(value.trim().length > 0, new ArgumentNotProvidedException('OTP code is required'));
    invariant(OTP_CODE_REGEX.test(value), new ArgumentInvalidException('OTP code must be a 6-digit code'));
  }
}
