import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import {
  IFindNotificationsInput,
  IFindOldestNotificationIdsForTrimInput,
  IUpdateReadByIdsInput
} from '@/modules/notification/domain/repositories/notification.repository.type';
import { NotificationMapper } from '@/modules/notification/infrastructure/mappers/notification.mapper';
import { NotificationModel } from '@/modules/notification/domain/repositories/notification.model';
import { Db, Filter, MongoClient } from 'mongodb';

export class NotificationRepository
  extends MongoRepositoryBase<NotificationEntity, NotificationModel>
  implements NotificationRepositoryPort
{
  protected collectionName = 'notifications';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: NotificationMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findNotifications({
    recipientId,
    actorUserIdNin,
    unreadOnly,
    limit,
    before
  }: IFindNotificationsInput): Promise<NotificationEntity[]> {
    const filter: Filter<NotificationModel> = { recipientId };
    if (actorUserIdNin && actorUserIdNin.length > 0) {
      filter['actor.userId'] = { $nin: actorUserIdNin };
    }
    if (unreadOnly) {
      filter.read = false;
    }
    if (before) {
      filter.$or = [
        { createdAt: { $lt: before.raw().createdAt } },
        { createdAt: before.raw().createdAt, _id: { $lt: before.raw().id } }
      ];
    }
    const results = await this.dbCollection.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  /** Prefer read documents first, then oldest by createdAt. */
  async findOldestNotificationIdsForTrim({
    recipientId,
    limit
  }: IFindOldestNotificationIdsForTrimInput): Promise<string[]> {
    if (limit <= 0) return [];
    const notifications = await this.dbCollection
      .find({ recipientId })
      .sort({ read: -1, createdAt: 1, _id: 1 })
      .limit(limit)
      .project({ _id: 1 })
      .toArray();
    const ids = notifications.map((notification) => notification._id);
    return ids;
  }

  async createNotification(data: NotificationEntity): Promise<NotificationEntity> {
    const record = this.mapper.toPersistence(data);
    await this.dbCollection.insertOne(record);
    return this.mapper.toDomain(record);
  }

  async createNotifications(data: NotificationEntity[]): Promise<void> {
    const records = data.map((record) => this.mapper.toPersistence(record));
    if (records.length === 0) return;
    await this.dbCollection.insertMany(records, { ordered: false });
  }

  async updateReadByIds({ ids, recipientId }: IUpdateReadByIdsInput): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.dbCollection.updateMany(
      { recipientId, _id: { $in: ids }, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return result.modifiedCount;
  }

  async updateAllRead(recipientId: string): Promise<number> {
    const result = await this.dbCollection.updateMany(
      { recipientId, read: false },
      { $set: { read: true, readAt: new Date() } }
    );
    return result.modifiedCount;
  }

  async deleteNotificationsByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.dbCollection.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  }

  async countForRecipient(recipientId: string): Promise<number> {
    return this.count({ recipientId } as Partial<NotificationEntity>);
    // const result = await this.dbCollection.countDocuments({ recipientId });
    // return result;
  }
}
