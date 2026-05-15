import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { ValueObject } from '@/modules/core/domain/value-objects/value-object.base';

export interface IMedia {
  url: string;
  type: EnumMediaType;
}

export class Media extends ValueObject<IMedia> {
  static create(value: IMedia): Media {
    return new Media(value);
  }

  get value(): IMedia {
    return this.raw();
  }

  protected validate(props: IMedia): void {
    invariant(typeof props.url === 'string', new ArgumentInvalidException('Media URL must be a string'));
    invariant(props.url.trim().length > 0, new ArgumentNotProvidedException('Media URL is required'));
    invariant(Media.isValidUrl(props.url), new ArgumentInvalidException('Media URL is invalid'));
    invariant(Object.values(EnumMediaType).includes(props.type), new ArgumentInvalidException('Media type is invalid'));
  }

  private static isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
}
