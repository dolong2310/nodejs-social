import { EMediaType } from '@/domain/enums/media.enum';

export class Media {
  private _url: string;
  private _type: EMediaType;

  get url(): string {
    return this._url;
  }

  get type(): EMediaType {
    return this._type;
  }

  private constructor(url: string, type: EMediaType) {
    this._url = url;
    this._type = type;
  }

  static create({ url, type }: { url: string; type: EMediaType }): Media {
    return new Media(url, type);
  }
}
