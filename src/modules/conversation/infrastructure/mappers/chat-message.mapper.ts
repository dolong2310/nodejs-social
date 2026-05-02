import { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import { ChatMessageModel, chatMessageSchema } from '@/modules/conversation/domain/repositories/chat-message.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class ChatMessageMapper implements Mapper<ChatMessageEntity, ChatMessageModel> {
  toPersistence(entity: ChatMessageEntity): ChatMessageModel {
    const clone = entity.getProps();
    const record: ChatMessageModel = {
      _id: clone.id.toString(),
      conversationId: clone.conversationId,
      senderId: clone.senderId,
      text: clone.text,
      attachments: clone.attachments,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(chatMessageSchema, record);
  }
  toDomain(record: ChatMessageModel): ChatMessageEntity {
    const entity = new ChatMessageEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        conversationId: record.conversationId,
        senderId: record.senderId,
        text: record.text,
        attachments: record.attachments
      }
    });
    return entity;
  }
  toResponse() {}
}
