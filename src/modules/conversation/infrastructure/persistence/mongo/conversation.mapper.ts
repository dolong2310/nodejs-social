import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { ConversationFullProps } from '@/modules/conversation/domain/entities/conversation.type';
import {
  ConversationModel,
  conversationSchema
} from '@/modules/conversation/infrastructure/persistence/mongo/conversation.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class ConversationMapper implements Mapper<ConversationEntity, ConversationModel, ConversationFullProps> {
  toPersistence(entity: ConversationEntity): ConversationModel {
    const clone = entity.getProps();
    const record: ConversationModel = {
      _id: clone.id.toString(),
      type: clone.type,
      created_by: clone.createdBy,
      name: clone.name,
      avatar_media_id: clone.avatarMediaId,
      user_id_low: clone.userIdLow,
      user_id_high: clone.userIdHigh,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(conversationSchema, record);
  }
  toDomain(record: ConversationModel): ConversationEntity {
    const entity = new ConversationEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        type: record.type,
        createdBy: record.created_by,
        name: record.name,
        avatarMediaId: record.avatar_media_id,
        userIdLow: record.user_id_low,
        userIdHigh: record.user_id_high
      }
    });
    return entity;
  }
  toResponse(record: ConversationModel): ConversationFullProps {
    const response = {
      id: record._id,
      type: record.type,
      createdBy: record.created_by,
      name: record.name,
      avatarMediaId: record.avatar_media_id,
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
