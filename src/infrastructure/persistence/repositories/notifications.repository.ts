import { INotification } from '@/domain/entities/notification.entity';
import {
  ICountForRecipientInput,
  IDeleteNotificationsByIdsInput,
  IFindNotificationsInput,
  IFindOldestNotificationIdsForTrimInput,
  IFindOldestNotificationIdsForTrimOutput,
  IUpdateAllReadInput,
  IUpdateReadByIdsInput
} from '@/domain/repositories/notification/notification.interface';
import { INotificationRepository } from '@/domain/repositories/notification/notification.repository';

import { NotificationMapper } from '@/infrastructure/persistence/mapper/notification.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { INotificationModel } from '@/infrastructure/persistence/mongodb/models/notification.model';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

import { Filter, ObjectId } from 'mongodb';

export class NotificationRepository extends BaseRepository implements INotificationRepository {
  constructor(
    db: DatabaseService,
    private readonly mapper: NotificationMapper
  ) {
    super(db);
  }

  async findNotifications(data: IFindNotificationsInput): Promise<INotification[]> {
    const record = this.mapper.toPersistence(data);
    const filter: Filter<INotificationModel> = { recipientId: record.recipientId };
    if (data.actorUserIdNin && data.actorUserIdNin.length > 0) {
      filter['actor.userId'] = { $nin: data.actorUserIdNin };
    }
    if (data.unreadOnly) {
      filter.read = false;
    }
    if (data.before) {
      const beforeId = new ObjectId(data.before.id);
      filter.$or = [
        { createdAt: { $lt: data.before.createdAt } },
        { createdAt: data.before.createdAt, _id: { $lt: beforeId } }
      ];
    }
    const results = await this.db.notifications
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(data.limit)
      .toArray();
    const result = results.map((result) => this.mapper.toDomain(result));
    return result;
  }

  /** Prefer read documents first, then oldest by createdAt. */
  async findOldestNotificationIdsForTrim(
    data: IFindOldestNotificationIdsForTrimInput
  ): Promise<IFindOldestNotificationIdsForTrimOutput> {
    const record = this.mapper.toPersistence(data);
    if (data.take <= 0) return { ids: [] };
    const rows = await this.db.notifications
      .find({ recipientId: record.recipientId })
      .sort({ read: -1, createdAt: 1, _id: 1 })
      .limit(data.take)
      .project({ _id: 1 })
      .toArray();
    return { ids: rows.map((d) => d._id) };
  }

  async createNotification(data: INotification): Promise<INotification> {
    const document = this.mapper.toPersistence(data);
    await this.db.notifications.insertOne(document);
    return this.mapper.toDomain(document);
  }

  async createNotifications(data: INotification[]): Promise<void> {
    const documents = data.map((d) => this.mapper.toPersistence(d));
    if (documents.length === 0) return;
    await this.db.notifications.insertMany(documents, { ordered: false });
  }

  async updateReadByIds(data: IUpdateReadByIdsInput): Promise<number> {
    const record = this.mapper.toPersistence(data);
    if (data.ids.length === 0) return 0;
    const oids = data.ids.map((id) => new ObjectId(id));
    const result = await this.db.notifications.updateMany(
      { recipientId: record.recipientId, _id: { $in: oids }, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return result.modifiedCount;
  }

  async updateAllRead(data: IUpdateAllReadInput): Promise<number> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.notifications.updateMany(
      { recipientId: record.recipientId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return result.modifiedCount;
  }

  async deleteNotificationsByIds(data: IDeleteNotificationsByIdsInput): Promise<number> {
    if (data.ids.length === 0) return 0;
    const result = await this.db.notifications.deleteMany({ _id: { $in: data.ids.map((id) => new ObjectId(id)) } });
    return result.deletedCount;
  }

  async countForRecipient(data: ICountForRecipientInput): Promise<number> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.notifications.countDocuments({ recipientId: record.recipientId });
    return result;
  }
}
