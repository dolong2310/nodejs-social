import { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import { ChatMessageModel, chatMessageSchema } from '@/modules/conversation/infrastructure/mongo/chat-message.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class ChatMessageMapper implements Mapper<ChatMessageEntity, ChatMessageModel> {
  toPersistence(entity: ChatMessageEntity): ChatMessageModel {
    const clone = entity.getProps();
    const record: ChatMessageModel = {
      _id: clone.id.toString(),
      conversation_id: clone.conversationId,
      sender_id: clone.senderId,
      text: clone.text,
      attachments: clone.attachments,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(chatMessageSchema, record);
  }
  toDomain(record: ChatMessageModel): ChatMessageEntity {
    const entity = new ChatMessageEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        conversationId: record.conversation_id,
        senderId: record.sender_id,
        text: record.text,
        attachments: record.attachments
      }
    });
    return entity;
  }
  toResponse() {}
}
