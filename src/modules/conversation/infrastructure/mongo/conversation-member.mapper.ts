import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import {
  ConversationMemberModel,
  conversationMemberSchema
} from '@/modules/conversation/infrastructure/mongo/conversation-member.model';
import { parse } from 'valibot';

export class ConversationMemberMapper implements Mapper<ConversationMemberEntity, ConversationMemberModel> {
  toPersistence(entity: ConversationMemberEntity): ConversationMemberModel {
    const clone = entity.getProps();
    const record: ConversationMemberModel = {
      _id: clone.id.toString(),
      conversation_id: clone.conversationId,
      user_id: clone.userId,
      role: clone.role,
      joined_at: clone.joinedAt,
      last_read_at: clone.lastReadAt,
      last_read_message_id: clone.lastReadMessageId,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(conversationMemberSchema, record);
  }
  toDomain(record: ConversationMemberModel): ConversationMemberEntity {
    const entity = new ConversationMemberEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        conversationId: record.conversation_id,
        userId: record.user_id,
        role: record.role,
        joinedAt: record.joined_at,
        lastReadAt: record.last_read_at,
        lastReadMessageId: record.last_read_message_id
      }
    });
    return entity;
  }
  toResponse() {}
}
