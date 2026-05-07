import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { FriendshipEntity } from '@/modules/friend/domain/entities/friendship.entity';
import { FriendshipModel, friendshipSchema } from '@/modules/friend/infrastructure/mongo/friendship.model';
import { parse } from 'valibot';

export class FriendshipMapper implements Mapper<FriendshipEntity, FriendshipModel> {
  toPersistence(entity: FriendshipEntity): FriendshipModel {
    const clone = entity.getProps();
    const record: FriendshipModel = {
      _id: clone.id.toString(),
      user_id_low: clone.userIdLow,
      user_id_high: clone.userIdHigh,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(friendshipSchema, record);
  }
  toDomain(record: FriendshipModel): FriendshipEntity {
    const entity = new FriendshipEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        userIdLow: record.user_id_low,
        userIdHigh: record.user_id_high
      }
    });
    return entity;
  }
  toResponse() {}
}
