import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { HashtagEntity } from '@/modules/hashtag/domain/entities/hashtag.entity';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';
import {
  ICreateHashtagInput,
  IListHashtagsInput,
  IUpdateHashtagInput
} from '@/modules/hashtag/domain/repositories/hashtag.repository.type';
import { HashtagMapper } from '@/modules/hashtag/infrastructure/mappers/hashtag.mapper';
import { HashtagModel } from '@/modules/hashtag/infrastructure/mongo/hashtag.model';
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

  async createHashtag(data: ICreateHashtagInput): Promise<HashtagEntity> {
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
          filter: { name },
          update: { $setOnInsert: record },
          upsert: true
        }
      };
    });

    // Thực hiện bulkWrite để upsert (chèn mới hoặc cập nhật) nhiều hashtag cùng lúc.
    // option { ordered: false } cho phép các thao tác upsert diễn ra song song, không dừng lại khi có 1 thao tác bị lỗi (ví dụ trùng key),
    // Điều này giúp tối ưu hiệu suất khi insert nhiều hashtag cùng lúc và không bị ảnh hưởng nếu có hashtag đã tồn tại.
    // Tránh loop find one and update vì N + 1 query (nhiều round-trip).
    await this.dbCollection.bulkWrite(ops, { ordered: false });

    const result = await this.dbCollection
      .find({ name: { $in: hashtags } }, { projection: { _id: 1, name: 1 } })
      .toArray();

    return result.map((item) => this.mapper.toDomain(item));
  }

  async findHashtagById(id: string): Promise<HashtagEntity | null> {
    const record = await this.dbCollection.findOne({ _id: id });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findHashtagByName(name: string): Promise<HashtagEntity | null> {
    const record = await this.dbCollection.findOne({ name });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findHashtags({ limit, skip = 0 }: IListHashtagsInput): Promise<HashtagEntity[]> {
    const records = await this.dbCollection.find({}).sort({ name: 1 }).skip(skip).limit(limit).toArray();
    return records.map((item) => this.mapper.toDomain(item));
  }

  async countHashtags(): Promise<number> {
    return this.dbCollection.countDocuments({});
  }

  async updateHashtag(id: string, data: IUpdateHashtagInput): Promise<HashtagEntity | null> {
    const patch: Record<string, unknown> = { ...data, updatedAt: new Date() };
    const record = await this.dbCollection.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' });
    return record ? this.mapper.toDomain(record) : null;
  }

  async deleteHashtag(id: string): Promise<HashtagEntity | null> {
    const record = await this.dbCollection.findOneAndDelete({ _id: id });
    return record ? this.mapper.toDomain(record) : null;
  }
}
