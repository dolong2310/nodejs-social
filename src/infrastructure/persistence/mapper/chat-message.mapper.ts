import { ChatMessageEntity } from '@/domain/entities/chat-message.entity';
import { IChatMessageModel } from '@/infrastructure/persistence/mongodb/models/chat-message.model';
import { ObjectId } from 'mongodb';

export class ChatMessageMapper {
  toPersistence(entity: Partial<ChatMessageEntity>): IChatMessageModel {
    const clone = entity;
    const record: IChatMessageModel = {
      _id: new ObjectId(clone.id),
      conversationId: new ObjectId(clone.conversationId),
      senderId: new ObjectId(clone.senderId),
      text: clone.text,
      attachments: clone.attachments,
      createdAt: clone.createdAt ?? new Date()
    };
    return record;
  }
  toDomain(record: IChatMessageModel): ChatMessageEntity {
    return ChatMessageEntity.create({
      id: record._id?.toString() ?? '',
      conversationId: record.conversationId.toString(),
      senderId: record.senderId.toString(),
      text: record.text,
      attachments: record.attachments,
      createdAt: record.createdAt ?? new Date()
    });
  }
  toResponse() {}
}
