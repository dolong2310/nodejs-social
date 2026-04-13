import { FriendshipEntity } from '@/domain/entities/friendship.entity';
import { IFriendshipModel } from '@/infrastructure/persistence/mongodb/models/friendship.model';
import { ObjectId } from 'mongodb';

export class FriendshipMapper {
  toPersistence(entity: Partial<FriendshipEntity>): IFriendshipModel {
    const clone = entity;
    const record: IFriendshipModel = {
      _id: new ObjectId(clone.id),
      userIdLow: new ObjectId(clone.userIdLow),
      userIdHigh: new ObjectId(clone.userIdHigh),
      createdAt: clone.createdAt ? new Date(clone.createdAt) : new Date()
    };
    return record;
  }
  toDomain(record: IFriendshipModel): FriendshipEntity {
    return FriendshipEntity.create({
      id: record._id?.toString() ?? '',
      userIdLow: record.userIdLow.toString(),
      userIdHigh: record.userIdHigh.toString(),
      createdAt: record.createdAt ?? new Date()
    });
  }
  toResponse() {}
}
