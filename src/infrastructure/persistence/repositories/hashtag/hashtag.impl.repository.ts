import { LoggerPort } from '@/application/ports/logger.port';
import { HashtagEntity } from '@/domain/entities/hashtag/hashtag.entity';
import { HashtagRepositoryPort } from '@/domain/repositories/hashtag/hashtag.repository';
import { ICreateHashtagInput } from '@/domain/repositories/hashtag/hashtag.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { HashtagMapper } from '@/infrastructure/persistence/repositories/hashtag/hashtag.mapper';
import { HashtagModel } from '@/infrastructure/persistence/repositories/hashtag/hashtag.model';
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
}
