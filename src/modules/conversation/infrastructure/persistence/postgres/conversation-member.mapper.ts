import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import { ConversationMemberFullProps } from '@/modules/conversation/domain/entities/conversation-member.type';
import {
  ConversationMemberModel,
  conversationMemberSchema
} from '@/modules/conversation/infrastructure/persistence/postgres/conversation-member.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class ConversationMemberMapper implements Mapper<
  ConversationMemberEntity,
  ConversationMemberModel,
  ConversationMemberFullProps
> {
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
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(conversationMemberSchema, record);
  }
  toDomain(record: ConversationMemberModel): ConversationMemberEntity {
    const entity = new ConversationMemberEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
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
  toResponse(record: ConversationMemberModel): ConversationMemberFullProps {
    const response = {
      id: record.id,
      conversationId: record.conversation_id,
      userId: record.user_id,
      role: record.role,
      joinedAt: record.joined_at,
      lastReadAt: record.last_read_at,
      lastReadMessageId: record.last_read_message_id,
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
