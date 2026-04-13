import { IUser } from '@/domain/entities/user.entity';
import { ObjectId } from 'mongodb';

export interface IUserModel extends Omit<IUser, 'id'> {
  _id?: ObjectId;
}
