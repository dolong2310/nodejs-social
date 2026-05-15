import { USERNAME_REGEX } from '@/modules/common/constants/regex.constants';
import {
  ArgumentInvalidException,
  ArgumentNotProvidedException,
  ArgumentOutOfRangeException
} from '@/modules/core/domain/exceptions/exceptions';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { DomainPrimitive, ValueObject } from '@/modules/core/domain/value-objects/value-object.base';

export class Username extends ValueObject<string> {
  constructor(value: string) {
    super({ value: Username.normalizeRequired(value) });
  }

  static create(value: string): Username {
    return new Username(value);
  }

  static normalize(value?: string | null): string | undefined {
    const normalized = typeof value === 'string' ? value.trim().toLowerCase() : undefined;
    return normalized || undefined;
  }

  static createOptional(value?: string | null): Username | undefined {
    const normalized = Username.normalize(value);
    return normalized === undefined ? undefined : new Username(normalized);
  }

  get value(): string {
    return this.raw();
  }

  private static normalizeRequired(value: string): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : value;
  }

  protected validate(props: DomainPrimitive<string>): void {
    const { value } = props;
    invariant(typeof value === 'string', new ArgumentInvalidException('Username must be a string'));
    invariant(value.trim().length > 0, new ArgumentNotProvidedException('Username is required'));
    invariant(
      value.length >= 2 && value.length <= 30,
      new ArgumentOutOfRangeException('Username length must be from 2 to 30 characters')
    );
    invariant(USERNAME_REGEX.test(value), new ArgumentInvalidException('Invalid username format'));
  }
}
