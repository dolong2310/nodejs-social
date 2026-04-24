import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { ConversationEntity } from '@/domain/entities/conversation/conversation.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import {
  ConversationModel,
  conversationSchema
} from '@/infrastructure/persistence/repositories/conversation/conversation.model';
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
