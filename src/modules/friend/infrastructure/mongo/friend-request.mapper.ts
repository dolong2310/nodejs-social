import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { FriendRequestEntity } from '@/modules/friend/domain/entities/friend-request.entity';
import { FriendRequestModel, friendRequestSchema } from '@/modules/friend/infrastructure/mongo/friend-request.model';
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
