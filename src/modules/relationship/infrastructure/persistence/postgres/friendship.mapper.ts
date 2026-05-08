import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { FriendshipEntity } from '@/modules/relationship/domain/entities/friendship.entity';
import { FriendshipFullProps } from '@/modules/relationship/domain/entities/friendship.type';
import {
  FriendshipModel,
  friendshipSchema
} from '@/modules/relationship/infrastructure/persistence/postgres/friendship.model';
import { parse } from 'valibot';

export class FriendshipMapper implements Mapper<FriendshipEntity, FriendshipModel, FriendshipFullProps> {
  toPersistence(entity: FriendshipEntity): FriendshipModel {
    const clone = entity.getProps();
    const record: FriendshipModel = {
      id: clone.id.toString(),
      user_id_low: clone.userIdLow,
      user_id_high: clone.userIdHigh,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(friendshipSchema, record);
  }
  toDomain(record: FriendshipModel): FriendshipEntity {
    return new FriendshipEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        userIdLow: record.user_id_low,
        userIdHigh: record.user_id_high
      }
    });
  }
  toResponse(record: FriendshipModel): FriendshipFullProps {
    return {
      id: record.id,
      userIdLow: record.user_id_low,
      userIdHigh: record.user_id_high,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
