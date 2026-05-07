import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import {
  ConversationMemberModel,
  conversationMemberSchema
} from '@/modules/conversation/infrastructure/postgres/conversation-member.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class ConversationMemberMapper implements Mapper<ConversationMemberEntity, ConversationMemberModel> {
  toPersistence(entity: ConversationMemberEntity): ConversationMemberModel {
    const clone = entity.getProps();
    const record: ConversationMemberModel = {
      id: clone.id.toString(),
      conversation_id: clone.conversationId,
      user_id: clone.userId,
      role: clone.role,
      joined_at: clone.joinedAt,
      last_read_at: clone.lastReadAt ?? null,
      last_read_message_id: clone.lastReadMessageId ?? null,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(conversationMemberSchema, record);
  }
  toDomain(record: ConversationMemberModel): ConversationMemberEntity {
    return new ConversationMemberEntity({
      id: new UniqueEntityID(record.id),
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
  }
  toResponse() {}
}
