import { validatePath } from '@/modules/authorization/domain/helpers/validate-path';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { DomainPrimitive, ValueObject } from '@/modules/core/domain/value-objects/value-object.base';

export class PermissionPath extends ValueObject<string> {
  constructor(value: string) {
    super({ value: PermissionPath.normalize(value) });
  }

  static create(value: string): PermissionPath {
    return new PermissionPath(value);
  }

  static normalize(value: string): string {
    return typeof value === 'string' ? value.trim() : value;
  }

  get value(): string {
    return this.raw();
  }

  protected validate(props: DomainPrimitive<string>): void {
    const { value } = props;
    invariant(typeof value === 'string', new ArgumentInvalidException('Permission path must be a string'));
    invariant(value.trim().length > 0, new ArgumentNotProvidedException('Permission path is required'));
    invariant(validatePath(value, { allowParams: true }), new ArgumentInvalidException('Permission path is invalid'));
  }
}
