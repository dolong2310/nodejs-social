import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { FriendshipEntity } from '@/modules/relationship/domain/entities/friendship.entity';
import { FriendshipFullProps } from '@/modules/relationship/domain/entities/friendship.type';
import {
  FriendshipModel,
  friendshipSchema
} from '@/modules/relationship/infrastructure/persistence/mongo/friendship.model';
import { parse } from 'valibot';

export class FriendshipMapper implements Mapper<FriendshipEntity, FriendshipModel, FriendshipFullProps> {
  toPersistence(entity: FriendshipEntity): FriendshipModel {
    const clone = entity.getProps();
    const record: FriendshipModel = {
      _id: clone.id.toString(),
      user_id_low: clone.userIdLow,
      user_id_high: clone.userIdHigh,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(friendshipSchema, record);
  }
  toDomain(record: FriendshipModel): FriendshipEntity {
    const entity = new FriendshipEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        userIdLow: record.user_id_low,
        userIdHigh: record.user_id_high
      }
    });
    return entity;
  }
  toResponse(record: FriendshipModel): FriendshipFullProps {
    const response = {
      id: record._id,
      userIdLow: record.user_id_low,
      userIdHigh: record.user_id_high,
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null
    };
    return response;
  }
}
