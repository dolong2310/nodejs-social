import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { LikeEntity } from '@/modules/like/domain/entities/like.entity';
import { LikeRepositoryPort } from '@/modules/like/domain/repositories/like.repository';
import { ICreateLikeInput, IDeleteLikeInput } from '@/modules/like/domain/repositories/like.repository.type';
import { LikeMapper } from '@/modules/like/infrastructure/mappers/like.mapper';
import { LikeModel } from '@/modules/like/domain/repositories/like.model';
import { Db, MongoClient } from 'mongodb';

export class LikeRepository extends MongoRepositoryBase<LikeEntity, LikeModel> implements LikeRepositoryPort {
  protected collectionName = 'likes';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: LikeMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async createLike(data: ICreateLikeInput): Promise<LikeEntity | null> {
    const entity = LikeEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    const result = await this.dbCollection.findOneAndUpdate(
      { userId: record.userId, postId: record.postId },
      { $setOnInsert: record },
      { upsert: true, returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async deleteLike(data: IDeleteLikeInput): Promise<LikeEntity | null> {
    const record = await this.dbCollection.findOneAndDelete({ userId: data.userId, postId: data.postId });
    return record ? this.mapper.toDomain(record) : null;
  }
}
