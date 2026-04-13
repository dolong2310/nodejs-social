import { IRefreshToken } from '@/domain/entities/refresh-token.entity';
import { ObjectId } from 'mongodb';

export interface IRefreshTokenModel extends Omit<IRefreshToken, 'id' | 'userId'> {
  _id?: ObjectId;
  userId: ObjectId;
}
