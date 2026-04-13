import { FriendRequestEntity } from '@/domain/entities/friend-request.entity';
import { IFriendRequestModel } from '@/infrastructure/persistence/mongodb/models/friend-request.model';
import { ObjectId } from 'mongodb';

export class FriendRequestMapper {
  toPersistence(entity: Partial<FriendRequestEntity>): IFriendRequestModel {
    const clone = entity;
    const record: IFriendRequestModel = {
      _id: new ObjectId(clone.id),
      fromUserId: new ObjectId(clone.fromUserId),
      toUserId: new ObjectId(clone.toUserId),
      createdAt: clone.createdAt ? new Date(clone.createdAt) : new Date()
    };
    return record;
  }
  toDomain(record: IFriendRequestModel): FriendRequestEntity {
    return FriendRequestEntity.create({
      id: record._id?.toString() ?? '',
      fromUserId: record.fromUserId.toString(),
      toUserId: record.toUserId.toString(),
      createdAt: record.createdAt ?? new Date()
    });
  }
  toResponse() {}
}
