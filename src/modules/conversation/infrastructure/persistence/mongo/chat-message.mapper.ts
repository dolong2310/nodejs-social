import { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import { ChatMessageFullProps } from '@/modules/conversation/domain/entities/chat-message.type';
import {
  ChatMessageModel,
  chatMessageSchema
} from '@/modules/conversation/infrastructure/persistence/mongo/chat-message.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class ChatMessageMapper implements Mapper<ChatMessageEntity, ChatMessageModel, ChatMessageFullProps> {
  toPersistence(entity: ChatMessageEntity): ChatMessageModel {
    const clone = entity.getProps();
    const record: ChatMessageModel = {
      _id: clone.id.toString(),
      conversation_id: clone.conversationId,
      sender_id: clone.senderId,
      text: clone.text,
      attachments: clone.attachments,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(chatMessageSchema, record);
  }
  toDomain(record: ChatMessageModel): ChatMessageEntity {
    const entity = new ChatMessageEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        conversationId: record.conversation_id,
        senderId: record.sender_id,
        text: record.text,
        attachments: record.attachments
      }
    });
    return entity;
  }
  toResponse(record: ChatMessageModel): ChatMessageFullProps {
    const response = {
      id: record._id,
      conversationId: record.conversation_id,
      senderId: record.sender_id,
      text: record.text,
      attachments: record.attachments,
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
