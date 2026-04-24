import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { FriendRequestEntity } from '@/domain/entities/friend-request/friend-request.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import {
  FriendRequestModel,
  friendRequestSchema
} from '@/infrastructure/persistence/repositories/friend-request/friend-request.model';
import { parse } from 'valibot';

export class FriendRequestMapper implements Mapper<FriendRequestEntity, FriendRequestModel> {
  toPersistence(entity: FriendRequestEntity): FriendRequestModel {
    const clone = entity.getProps();
    const record: FriendRequestModel = {
      _id: clone.id.toString(),
      fromUserId: clone.fromUserId,
      toUserId: clone.toUserId,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(friendRequestSchema, record);
  }
  toDomain(record: FriendRequestModel): FriendRequestEntity {
    const entity = new FriendRequestEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        fromUserId: record.fromUserId,
        toUserId: record.toUserId
      }
    });
    return entity;
  }
  toResponse() {}
}
