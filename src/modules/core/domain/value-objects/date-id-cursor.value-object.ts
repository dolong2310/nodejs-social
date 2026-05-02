import { ValueObject } from '@/modules/core/domain/value-objects/value-object.base';

export interface IDateIdCursor {
  id: string;
  createdAt: Date;
}

export class DateIdCursor extends ValueObject<IDateIdCursor> {
  protected validate(props: IDateIdCursor): void {}
}
