import { IBlock } from '@/domain/entities/block.entity';
import { ObjectId } from 'mongodb';

export interface IBlockModel extends Omit<IBlock, 'id' | 'blockerId' | 'blockedId'> {
  _id?: ObjectId;
  blockerId: ObjectId;
  blockedId: ObjectId;
}
