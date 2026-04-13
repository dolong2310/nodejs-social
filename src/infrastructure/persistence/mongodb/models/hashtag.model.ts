import { IHashtag } from '@/domain/entities/hashtag.entity';
import { ObjectId } from 'mongodb';

export interface IHashtagModel extends Omit<IHashtag, 'id' | 'name'> {
  _id?: ObjectId;
  name: ObjectId;
}
