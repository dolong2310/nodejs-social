import { ObjectId } from 'mongodb';

export interface IHashtag {
  _id: ObjectId;
  name: string;
  createdAt?: Date;
}

export class HashtagSchema {
  public _id: ObjectId;
  public name: string;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor({ _id, name, createdAt }: Omit<IHashtag, '_id'> & { _id?: ObjectId }) {
    const date = new Date();

    this._id = _id ?? new ObjectId();
    this.name = name;
    this.createdAt = createdAt ?? date;
  }
}
