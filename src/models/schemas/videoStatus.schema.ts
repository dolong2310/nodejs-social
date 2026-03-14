import { EEncodingVideoStatus } from '@/enums/media.enum';
import { ObjectId } from 'mongodb';

export interface IVideoStatus {
  _id?: ObjectId;
  name: string;
  status: EEncodingVideoStatus;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class VideoStatusSchema {
  public _id?: ObjectId;
  public name: string;
  public status: EEncodingVideoStatus;
  public message: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor({ _id, name, status, message, createdAt, updatedAt }: IVideoStatus) {
    const date = new Date();

    this._id = _id ?? new ObjectId();
    this.name = name;
    this.status = status;
    this.message = message ?? '';
    this.createdAt = createdAt ?? date;
    this.updatedAt = updatedAt ?? date;
  }
}

export default VideoStatusSchema;
