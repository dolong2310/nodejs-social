import { ConversationEntity } from '@/domain/entities/conversation.entity';
import { EConversationType } from '@/domain/enums/conversation.enum';
import { IConversationModel } from '@/infrastructure/persistence/mongodb/models/conversation.model';
import { ObjectId } from 'mongodb';

export class ConversationMapper {
  toPersistence(entity: Partial<ConversationEntity>): IConversationModel {
    const clone = entity;
    const record: IConversationModel = {
      _id: new ObjectId(clone.id),
      type: clone.type ?? EConversationType.DIRECT,
      createdBy: new ObjectId(clone.createdBy),
      createdAt: clone.createdAt ? new Date(clone.createdAt) : new Date(),
      updatedAt: clone.updatedAt ? new Date(clone.updatedAt) : new Date(),
      name: clone.name,
      avatarMediaId: clone.avatarMediaId ? new ObjectId(clone.avatarMediaId) : undefined,
      userIdLow: clone.userIdLow ? new ObjectId(clone.userIdLow) : undefined,
      userIdHigh: clone.userIdHigh ? new ObjectId(clone.userIdHigh) : undefined
    };
    return record;
  }
  toDomain(record: IConversationModel): ConversationEntity {
    return ConversationEntity.create({
      id: record._id?.toString() ?? '',
      type: record.type ?? EConversationType.DIRECT,
      createdBy: record.createdBy.toString(),
      createdAt: record.createdAt ?? new Date(),
      updatedAt: record.updatedAt ?? new Date(),
      name: record.name,
      avatarMediaId: record.avatarMediaId?.toString() ?? undefined,
      userIdLow: record.userIdLow?.toString() ?? undefined,
      userIdHigh: record.userIdHigh?.toString() ?? undefined
    });
  }
  toResponse() {}
}
