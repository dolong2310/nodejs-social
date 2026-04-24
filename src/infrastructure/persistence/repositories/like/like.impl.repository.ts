import { LoggerPort } from '@/application/ports/logger.port';
import { LikeEntity } from '@/domain/entities/like/like.entity';
import { LikeRepositoryPort } from '@/domain/repositories/like/like.repository';
import { ICreateLikeInput, IDeleteLikeInput } from '@/domain/repositories/like/like.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { LikeMapper } from '@/infrastructure/persistence/repositories/like/like.mapper';
import { LikeModel } from '@/infrastructure/persistence/repositories/like/like.model';
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
