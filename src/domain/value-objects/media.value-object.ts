import { EMediaType } from '@/domain/enums/media.enum';
import { ValueObject } from '@/domain/value-objects/value-object.base';

export interface IMedia {
  url: string;
  type: EMediaType;
}

export class Media extends ValueObject<IMedia> {
  protected validate(props: IMedia): void {}
}
