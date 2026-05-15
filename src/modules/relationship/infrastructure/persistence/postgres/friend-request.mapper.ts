import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { FriendRequestEntity } from '@/modules/relationship/domain/entities/friend-request.entity';
import { FriendRequestFullProps } from '@/modules/relationship/domain/entities/friend-request.type';
import {
  FriendRequestModel,
  friendRequestSchema
} from '@/modules/relationship/infrastructure/persistence/postgres/friend-request.model';
import { parse } from 'valibot';

export class FriendRequestMapper implements Mapper<FriendRequestEntity, FriendRequestModel, FriendRequestFullProps> {
  toPersistence(entity: FriendRequestEntity): FriendRequestModel {
    const clone = entity.getProps();
    const record: FriendRequestModel = {
      id: clone.id.toString(),
      from_user_id: clone.fromUserId,
      to_user_id: clone.toUserId,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(friendRequestSchema, record);
  }
  toDomain(record: FriendRequestModel): FriendRequestEntity {
    const entity = new FriendRequestEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        fromUserId: record.from_user_id,
        toUserId: record.to_user_id
      }
    });
    return entity;
  }
  toResponse(record: FriendRequestModel): FriendRequestFullProps {
    const response = {
      id: record.id,
      fromUserId: record.from_user_id,
      toUserId: record.to_user_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
    return response;
  }
}
