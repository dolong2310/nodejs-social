import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { FriendshipEntity } from '@/domain/entities/friendship/friendship.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import {
  FriendshipModel,
  friendshipSchema
} from '@/infrastructure/persistence/repositories/friendship/friendship.model';
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
