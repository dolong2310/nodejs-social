import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { FriendRequestEntity } from '@/modules/relationship/domain/entities/friend-request.entity';
import { FriendRequestFullProps } from '@/modules/relationship/domain/entities/friend-request.type';
import {
  FriendRequestModel,
  friendRequestSchema
} from '@/modules/relationship/infrastructure/persistence/mongo/friend-request.model';
import { parse } from 'valibot';

export class FriendRequestMapper implements Mapper<FriendRequestEntity, FriendRequestModel, FriendRequestFullProps> {
  toPersistence(entity: FriendRequestEntity): FriendRequestModel {
    const clone = entity.getProps();
    const record: FriendRequestModel = {
      _id: clone.id.toString(),
      from_user_id: clone.fromUserId,
      to_user_id: clone.toUserId,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(friendRequestSchema, record);
  }
  toDomain(record: FriendRequestModel): FriendRequestEntity {
    const entity = new FriendRequestEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        fromUserId: record.from_user_id,
        toUserId: record.to_user_id
      }
    });
    return entity;
  }
  toResponse(record: FriendRequestModel): FriendRequestFullProps {
    const response = {
      id: record._id,
      fromUserId: record.from_user_id,
      toUserId: record.to_user_id,
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
