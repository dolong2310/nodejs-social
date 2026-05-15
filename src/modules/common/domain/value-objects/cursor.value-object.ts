import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { ValueObject } from '@/modules/core/domain/value-objects/value-object.base';

export interface IDateIdCursor {
  id: string;
  createdAt: Date;
}

export class DateIdCursor extends ValueObject<IDateIdCursor> {
  static create(value: IDateIdCursor): DateIdCursor {
    return new DateIdCursor(value);
  }

  get value(): IDateIdCursor {
    return this.raw();
  }

  protected validate(props: IDateIdCursor): void {
    invariant(typeof props.id === 'string', new ArgumentInvalidException('Cursor ID must be a string'));
    invariant(props.id.trim().length > 0, new ArgumentNotProvidedException('Cursor ID is required'));
    invariant(props.createdAt instanceof Date, new ArgumentInvalidException('Cursor date must be a valid Date'));
    invariant(
      !Number.isNaN(props.createdAt.getTime()),
      new ArgumentInvalidException('Cursor date must be a valid Date')
    );
  }
}
