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
      userIdLow: clone.userIdLow,
      userIdHigh: clone.userIdHigh,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(friendshipSchema, record);
  }
  toDomain(record: FriendshipModel): FriendshipEntity {
    const entity = new FriendshipEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        userIdLow: record.userIdLow,
        userIdHigh: record.userIdHigh
      }
    });
    return entity;
  }
  toResponse() {}
}
