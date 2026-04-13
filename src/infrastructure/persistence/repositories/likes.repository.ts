import { ILike, LikeEntity } from '@/domain/entities/like.entity';
import { ICreateLikeInput, IDeleteLikeInput } from '@/domain/repositories/like/like.interface';
import { ILikeRepository } from '@/domain/repositories/like/like.repository';

import { LikeMapper } from '@/infrastructure/persistence/mapper/like.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

export class LikeRepository extends BaseRepository implements ILikeRepository {
  constructor(
    db: DatabaseService,
    private readonly mapper: LikeMapper
  ) {
    super(db);
  }

  async createLike(data: ICreateLikeInput): Promise<ILike | null> {
    const record = this.mapper.toPersistence(data);
    const doc = LikeEntity.create({
      id: '123',
      userId: record.userId.toString(),
      postId: record.postId.toString(),
      createdAt: new Date()
    });
    const result = await this.db.likes.findOneAndUpdate(
      { userId: record.userId, postId: record.postId },
      { $setOnInsert: this.mapper.toPersistence(doc) },
      { upsert: true, returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async deleteLike(data: IDeleteLikeInput): Promise<ILike | null> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.likes.findOneAndDelete({ userId: record.userId, postId: record.postId });
    return result ? this.mapper.toDomain(result) : null;
  }
}
