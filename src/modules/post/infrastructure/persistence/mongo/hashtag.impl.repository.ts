import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { HashtagEntity } from '@/modules/post/domain/entities/hashtag.entity';
import { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';
import {
  CreateHashtagInput,
  ListHashtagsInput,
  UpdateHashtagInput
} from '@/modules/post/domain/repositories/hashtag.repository.type';
import { Options } from '@/modules/core/domain/repositories/port.repository';
import { HashtagMapper } from '@/modules/post/infrastructure/persistence/mongo/hashtag.mapper';
import { HashtagModel } from '@/modules/post/infrastructure/persistence/mongo/hashtag.model';
import { AnyBulkWriteOperation, Db, MongoClient } from 'mongodb';

export class HashtagRepository
  extends MongoRepositoryBase<HashtagEntity, HashtagModel>
  implements HashtagRepositoryPort
{
  protected collectionName = 'hashtags';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: HashtagMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async createHashtag(data: CreateHashtagInput): Promise<HashtagEntity> {
    const entity = HashtagEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    return this.mapper.toDomain(record);
  }

  async insertBulk(hashtags: string[]): Promise<HashtagEntity[]> {
    if (hashtags.length === 0) return [];

    const ops: AnyBulkWriteOperation<HashtagModel>[] = hashtags.map((name) => {
      const entity = HashtagEntity.create({ name });
      const record = this.mapper.toPersistence(entity);
      return {
        updateOne: {
          filter: { name, deleted_at: null },
          update: { $setOnInsert: record },
          upsert: true
        }
      };
    });

    // Use bulkWrite to upsert many hashtags at once.
    // { ordered: false } allows upserts to continue independently and not stop on one failed operation, such as a duplicate key.
    // This improves performance when inserting many hashtags and is unaffected by existing hashtags.
    // Avoid looping findOneAndUpdate because that creates N + 1 queries and many round trips.
    await this.dbCollection.bulkWrite(ops, { ordered: false });

    const result = await this.dbCollection
      .find({ name: { $in: hashtags }, deleted_at: null }, { projection: { _id: 1, name: 1 } })
      .toArray();

    return result.map((item) => this.mapper.toDomain(item));
  }

  async findHashtagById(id: string): Promise<HashtagEntity | null> {
    return this.findById(id);
  }

  async findHashtagByName(name: string): Promise<HashtagEntity | null> {
    const record = await this.dbCollection.findOne({ name, deleted_at: null });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findHashtags({ limit, skip = 0 }: ListHashtagsInput): Promise<HashtagEntity[]> {
    const records = await this.dbCollection
      .find({ deleted_at: null })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return records.map((item) => this.mapper.toDomain(item));
  }

  async countHashtags(): Promise<number> {
    return this.count();
  }

  async updateHashtag(id: string, data: UpdateHashtagInput): Promise<HashtagEntity | null> {
    const patch: Record<string, unknown> = { ...data, updated_at: new Date() };
    const record = await this.dbCollection.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { $set: patch },
      { returnDocument: 'after' }
    );
    return record ? this.mapper.toDomain(record) : null;
  }

  async deleteHashtag(id: string, options?: Options): Promise<HashtagEntity | null> {
    const current = await this.findHashtagById(id);
    if (!current) return null;
    const deleted = await this.deleteById(id, options);
    return deleted ? current : null;
  }
}
