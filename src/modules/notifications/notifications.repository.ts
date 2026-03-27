import { BaseRepository, INotification } from '@/modules';
import { Filter, ObjectId } from 'mongodb';

export interface INotificationRepository {
  insertOne(doc: INotification): Promise<INotification>;
  countForRecipient(recipientId: ObjectId): Promise<number>;
  findPageBeforeCursor(
    recipientId: ObjectId,
    limit: number,
    before?: { createdAt: Date; _id: ObjectId },
    unreadOnly?: boolean,
    /** Hide notifications whose actor is blocked with viewer (D-14). */
    actorUserIdNin?: string[]
  ): Promise<INotification[]>;
  markReadByIds(recipientId: ObjectId, ids: ObjectId[]): Promise<number>;
  markAllRead(recipientId: ObjectId): Promise<number>;
  findOldestIdsForTrim(recipientId: ObjectId, take: number): Promise<ObjectId[]>;
  deleteByIds(ids: ObjectId[]): Promise<number>;
}

export class NotificationRepository extends BaseRepository implements INotificationRepository {
  async insertOne(doc: INotification): Promise<INotification> {
    await this.db.notifications.insertOne(doc);
    return doc;
  }

  countForRecipient(recipientId: ObjectId): Promise<number> {
    return this.db.notifications.countDocuments({ recipientId });
  }

  async findPageBeforeCursor(
    recipientId: ObjectId,
    limit: number,
    before?: { createdAt: Date; _id: ObjectId },
    unreadOnly?: boolean,
    actorUserIdNin?: string[]
  ): Promise<INotification[]> {
    const filter: Filter<INotification> = { recipientId };
    if (actorUserIdNin && actorUserIdNin.length > 0) {
      filter['actor.userId'] = { $nin: actorUserIdNin };
    }
    if (unreadOnly) {
      filter.read = false;
    }
    if (before) {
      filter.$or = [
        { createdAt: { $lt: before.createdAt } },
        { createdAt: before.createdAt, _id: { $lt: before._id } }
      ];
    }
    return this.db.notifications.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
  }

  async markReadByIds(recipientId: ObjectId, ids: ObjectId[]): Promise<number> {
    if (ids.length === 0) return 0;
    const now = new Date();
    const r = await this.db.notifications.updateMany(
      { recipientId, _id: { $in: ids }, read: false },
      { $set: { read: true, readAt: now } }
    );
    return r.modifiedCount;
  }

  async markAllRead(recipientId: ObjectId): Promise<number> {
    const now = new Date();
    const r = await this.db.notifications.updateMany(
      { recipientId, read: false },
      { $set: { read: true, readAt: now } }
    );
    return r.modifiedCount;
  }

  /** Prefer read documents first, then oldest by createdAt (D-11). */
  async findOldestIdsForTrim(recipientId: ObjectId, take: number): Promise<ObjectId[]> {
    if (take <= 0) return [];
    const rows = await this.db.notifications
      .find({ recipientId })
      .sort({ read: -1, createdAt: 1, _id: 1 })
      .limit(take)
      .project({ _id: 1 })
      .toArray();
    return rows.map((d) => d._id);
  }

  async deleteByIds(ids: ObjectId[]): Promise<number> {
    if (ids.length === 0) return 0;
    const r = await this.db.notifications.deleteMany({ _id: { $in: ids } });
    return r.deletedCount;
  }
}
