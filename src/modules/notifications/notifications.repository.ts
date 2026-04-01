import { Injectable } from '@/decorators/injectable.decorator';
import { DateIdCursor } from '@/interfaces/types/cursor.type';
import { BaseRepository } from '@/modules/base/base.repository';
import { INotification } from '@/modules/notifications/notifications.schema';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { Filter, ObjectId } from 'mongodb';

export interface INotificationRepository {
  insertOne(doc: INotification): Promise<INotification>;
  insertMany(docs: INotification[]): Promise<void>;
  countForRecipient(recipientUserId: string): Promise<number>;
  findPageBeforeCursor(
    recipientUserId: string,
    limit: number,
    before?: DateIdCursor,
    unreadOnly?: boolean,
    /** Hide notifications whose actor is blocked with viewer (D-14). */
    actorUserIdNin?: string[]
  ): Promise<INotification[]>;
  markReadByIds(recipientUserId: string, ids: string[]): Promise<number>;
  markAllRead(recipientUserId: string): Promise<number>;
  findOldestIdsForTrim(recipientUserId: string, take: number): Promise<ObjectId[]>;
  deleteByIds(ids: ObjectId[]): Promise<number>;
}

@Injectable()
export class NotificationRepository extends BaseRepository implements INotificationRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async insertOne(doc: INotification): Promise<INotification> {
    await this.db.notifications.insertOne(doc);
    return doc;
  }

  async insertMany(docs: INotification[]): Promise<void> {
    if (docs.length === 0) return;
    await this.db.notifications.insertMany(docs, { ordered: false });
  }

  countForRecipient(recipientUserId: string): Promise<number> {
    return this.db.notifications.countDocuments({ recipientId: new ObjectId(recipientUserId) });
  }

  async findPageBeforeCursor(
    recipientUserId: string,
    limit: number,
    before?: DateIdCursor,
    unreadOnly?: boolean,
    actorUserIdNin?: string[]
  ): Promise<INotification[]> {
    const recipientId = new ObjectId(recipientUserId);
    const filter: Filter<INotification> = { recipientId };
    if (actorUserIdNin && actorUserIdNin.length > 0) {
      filter['actor.userId'] = { $nin: actorUserIdNin };
    }
    if (unreadOnly) {
      filter.read = false;
    }
    if (before) {
      const beforeId = new ObjectId(before._id);
      filter.$or = [{ createdAt: { $lt: before.createdAt } }, { createdAt: before.createdAt, _id: { $lt: beforeId } }];
    }
    return this.db.notifications.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
  }

  async markReadByIds(recipientUserId: string, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const now = new Date();
    const recipientId = new ObjectId(recipientUserId);
    const oids = ids.map((id) => new ObjectId(id));
    const r = await this.db.notifications.updateMany(
      { recipientId, _id: { $in: oids }, read: false },
      { $set: { read: true, readAt: now } }
    );
    return r.modifiedCount;
  }

  async markAllRead(recipientUserId: string): Promise<number> {
    const now = new Date();
    const recipientId = new ObjectId(recipientUserId);
    const r = await this.db.notifications.updateMany(
      { recipientId, read: false },
      { $set: { read: true, readAt: now } }
    );
    return r.modifiedCount;
  }

  /** Prefer read documents first, then oldest by createdAt (D-11). */
  async findOldestIdsForTrim(recipientUserId: string, take: number): Promise<ObjectId[]> {
    if (take <= 0) return [];
    const recipientId = new ObjectId(recipientUserId);
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
