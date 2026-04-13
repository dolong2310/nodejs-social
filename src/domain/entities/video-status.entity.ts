import { EEncodingVideoStatus } from '@/domain/enums/media.enum';

export interface IVideoStatus {
  id: string;
  name: string;
  status: EEncodingVideoStatus;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class VideoStatusEntity {
  private _id!: string;
  private _name!: string;
  private _status!: EEncodingVideoStatus;
  private _message?: string;
  private _createdAt?: Date;
  private _updatedAt?: Date;

  public get id(): string {
    return this._id;
  }
  private set id(value: string) {
    this._id = value;
  }

  public get name(): string {
    return this._name;
  }
  private set name(value: string) {
    this._name = value;
  }

  public get status(): EEncodingVideoStatus {
    return this._status;
  }
  private set status(value: EEncodingVideoStatus) {
    this._status = value;
  }

  public get message(): string | undefined {
    return this._message;
  }
  private set message(value: string | undefined) {
    this._message = value;
  }

  public get createdAt(): Date | undefined {
    return this._createdAt;
  }
  private set createdAt(value: Date | undefined) {
    this._createdAt = value;
  }

  public get updatedAt(): Date | undefined {
    return this._updatedAt;
  }
  private set updatedAt(value: Date | undefined) {
    this._updatedAt = value;
  }
  private constructor(data: IVideoStatus) {
    const date = new Date();
    this.id = data.id;
    this.name = data.name;
    this.status = data.status;
    this.message = data.message ?? '';
    this.createdAt = data.createdAt ?? date;
    this.updatedAt = data.updatedAt ?? date;
  }

  public static create(data: IVideoStatus): VideoStatusEntity {
    return new VideoStatusEntity(data);
  }
}
