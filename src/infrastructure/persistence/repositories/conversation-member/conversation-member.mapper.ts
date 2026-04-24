import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { ConversationMemberEntity } from '@/domain/entities/conversation-member/conversation-member.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import {
  ConversationMemberModel,
  conversationMemberSchema
} from '@/infrastructure/persistence/repositories/conversation-member/conversation-member.model';
import { parse } from 'valibot';

export class ConversationMemberMapper implements Mapper<ConversationMemberEntity, ConversationMemberModel> {
  toPersistence(entity: ConversationMemberEntity): ConversationMemberModel {
    const clone = entity.getProps();
    const record: ConversationMemberModel = {
      _id: clone.id.toString(),
      conversationId: clone.conversationId,
      userId: clone.userId,
      role: clone.role,
      joinedAt: clone.joinedAt,
      lastReadAt: clone.lastReadAt,
      lastReadMessageId: clone.lastReadMessageId,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(conversationMemberSchema, record);
  }
  toDomain(record: ConversationMemberModel): ConversationMemberEntity {
    const entity = new ConversationMemberEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        conversationId: record.conversationId,
        userId: record.userId,
        role: record.role,
        joinedAt: record.joinedAt,
        lastReadAt: record.lastReadAt,
        lastReadMessageId: record.lastReadMessageId
      }
    });
    return entity;
  }
  toResponse() {}
}
