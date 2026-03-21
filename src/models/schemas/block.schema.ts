import { ObjectId } from 'mongodb';

/** Block relationship on social DB (D-13). Unique on (blockerId, blockedId). */
export interface IBlock {
  _id: ObjectId;
  blockerId: ObjectId;
  blockedId: ObjectId;
  createdAt?: Date;
}

class BlockSchema {
  public _id: ObjectId;
  public blockerId: ObjectId;
  public blockedId: ObjectId;
  public createdAt?: Date;

  constructor({
    _id,
    blockerId,
    blockedId,
    createdAt
  }: Omit<IBlock, '_id'> & { _id?: ObjectId }) {
    this._id = _id ?? new ObjectId();
    this.blockerId = blockerId;
    this.blockedId = blockedId;
    this.createdAt = createdAt ?? new Date();
  }
}

export default BlockSchema;
