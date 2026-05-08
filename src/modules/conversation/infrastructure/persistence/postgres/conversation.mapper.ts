import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { ConversationFullProps } from '@/modules/conversation/domain/entities/conversation.type';
import {
  ConversationModel,
  conversationSchema
} from '@/modules/conversation/infrastructure/persistence/postgres/conversation.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class ConversationMapper implements Mapper<ConversationEntity, ConversationModel, ConversationFullProps> {
  toPersistence(entity: ConversationEntity): ConversationModel {
    const clone = entity.getProps();
    const record: ConversationModel = {
      id: clone.id.toString(),
      type: clone.type,
      created_by: clone.createdBy,
      name: clone.name ?? null,
      avatar_media_id: clone.avatarMediaId ?? null,
      user_id_low: clone.userIdLow ?? null,
      user_id_high: clone.userIdHigh ?? null,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(conversationSchema, record);
  }
  toDomain(record: ConversationModel): ConversationEntity {
    return new ConversationEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        type: record.type,
        createdBy: record.created_by,
        name: record.name ?? undefined,
        avatarMediaId: record.avatar_media_id,
        userIdLow: record.user_id_low ?? undefined,
        userIdHigh: record.user_id_high ?? undefined
      }
    });
  }
  toResponse(record: ConversationModel): ConversationFullProps {
    return {
      id: record.id,
      type: record.type,
      createdBy: record.created_by,
      name: record.name ?? undefined,
      avatarMediaId: record.avatar_media_id,
      userIdLow: record.user_id_low ?? undefined,
      userIdHigh: record.user_id_high ?? undefined,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
