import { EMediaType } from '@/modules/common/domain/enums/media.enum';
import { ValueObject } from '@/modules/core/domain/value-objects/value-object.base';

export interface IMedia {
  url: string;
  type: EMediaType;
}

export class Media extends ValueObject<IMedia> {
  protected validate(props: IMedia): void {}
}
