import { EEncodingVideoStatus } from '@/modules';
import { ObjectId } from 'mongodb';

export interface IVideoStatus {
  _id: ObjectId;
  name: string;
  status: EEncodingVideoStatus;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class VideoStatusSchema {
  public _id: ObjectId;
  public name: string;
  public status: EEncodingVideoStatus;
  public message: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor({ _id, name, status, message, createdAt, updatedAt }: Omit<IVideoStatus, '_id'> & { _id?: ObjectId }) {
    const date = new Date();

    this._id = _id ?? new ObjectId();
    this.name = name;
    this.status = status;
    this.message = message ?? '';
    this.createdAt = createdAt ?? date;
    this.updatedAt = updatedAt ?? date;
  }
}
