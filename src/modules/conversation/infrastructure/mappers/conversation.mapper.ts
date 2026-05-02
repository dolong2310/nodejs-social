import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import {
  ConversationModel,
  conversationSchema
} from '@/modules/conversation/domain/repositories/conversation.model';
import { parse } from 'valibot';

export class ConversationMapper implements Mapper<ConversationEntity, ConversationModel> {
  toPersistence(entity: ConversationEntity): ConversationModel {
    const clone = entity.getProps();
    const record: ConversationModel = {
      _id: clone.id.toString(),
      type: clone.type,
      createdBy: clone.createdBy,
      name: clone.name,
      avatarMediaId: clone.avatarMediaId,
      userIdLow: clone.userIdLow,
      userIdHigh: clone.userIdHigh,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(conversationSchema, record);
  }
  toDomain(record: ConversationModel): ConversationEntity {
    const entity = new ConversationEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        type: record.type,
        createdBy: record.createdBy,
        name: record.name,
        avatarMediaId: record.avatarMediaId,
        userIdLow: record.userIdLow,
        userIdHigh: record.userIdHigh
      }
    });
    return entity;
  }
  toResponse() {}
}
