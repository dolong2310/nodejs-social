import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { ChatMessageEntity } from '@/domain/entities/chat-message/chat-message.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import {
  ChatMessageModel,
  chatMessageSchema
} from '@/infrastructure/persistence/repositories/chat-message/chat-message.model';
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
