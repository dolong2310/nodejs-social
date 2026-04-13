import { ConversationMemberEntity } from '@/domain/entities/conversation-member.entity';
import { EConversationMemberRole } from '@/domain/enums/conversation-member.enum';
import { IConversationMemberModel } from '@/infrastructure/persistence/mongodb/models/conversation-member.model';
import { ObjectId } from 'mongodb';

export class ConversationMemberMapper {
  toPersistence(entity: Partial<ConversationMemberEntity>): IConversationMemberModel {
    const clone = entity;
    const record: IConversationMemberModel = {
      _id: new ObjectId(clone.id),
      conversationId: new ObjectId(clone.conversationId),
      userId: new ObjectId(clone.userId),
      role: clone.role ?? EConversationMemberRole.MEMBER,
      joinedAt: clone.joinedAt ?? new Date(),
      lastReadMessageId: clone.lastReadMessageId ? new ObjectId(clone.lastReadMessageId) : undefined,
      lastReadAt: clone.lastReadAt ? new Date(clone.lastReadAt) : undefined
    };
    return record;
  }
  toDomain(record: IConversationMemberModel): ConversationMemberEntity {
    return ConversationMemberEntity.create({
      id: record._id?.toString() ?? '',
      conversationId: record.conversationId.toString(),
      userId: record.userId.toString(),
      role: record.role ?? EConversationMemberRole.MEMBER,
      joinedAt: record.joinedAt ?? new Date(),
      lastReadMessageId: record.lastReadMessageId?.toString() ?? undefined,
      lastReadAt: record.lastReadAt ?? new Date()
    });
  }
  toResponse() {}
}
