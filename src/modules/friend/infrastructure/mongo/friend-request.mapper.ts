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
      from_user_id: clone.fromUserId,
      to_user_id: clone.toUserId,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(friendRequestSchema, record);
  }
  toDomain(record: FriendRequestModel): FriendRequestEntity {
    const entity = new FriendRequestEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        fromUserId: record.from_user_id,
        toUserId: record.to_user_id
      }
    });
    return entity;
  }
  toResponse() {}
}
