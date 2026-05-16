import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { CreatePostInput, UpdatePostInput } from '@/modules/post/domain/repositories/post.repository.type';
import { PostMapper } from '@/modules/post/infrastructure/persistence/mongo/post.mapper';
import { PostModel } from '@/modules/post/infrastructure/persistence/mongo/post.model';
import { Db, MongoClient } from 'mongodb';

export class PostRepository extends MongoRepositoryBase<PostEntity, PostModel> implements PostRepositoryPort {
  protected collectionName = 'posts';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: PostMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findPostById(id: string): Promise<PostEntity | null> {
    const result = await this.dbCollection.findOne({ _id: id, deleted_at: null });
    return result ? this.mapper.toDomain(result) : null;
  }

  async createPost(data: CreatePostInput): Promise<PostEntity> {
    const entity = PostEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    return this.mapper.toDomain(record);
  }

  async updatePost(data: UpdatePostInput): Promise<PostEntity | null> {
    const { postId, ownerUserId, audience, allowStrangerComments, content, hashtags, mentions, media } = data;
    const $set: Partial<PostModel> = {};

    if (audience !== undefined) $set.audience = audience;
    if (allowStrangerComments !== undefined) $set.allow_stranger_comments = allowStrangerComments;
    if (content !== undefined) $set.content = content;
    if (hashtags !== undefined) $set.hashtags = hashtags;
    if (mentions !== undefined) $set.mentions = mentions;
    if (media !== undefined) $set.media = media.map((item) => item.raw());

    if (Object.keys($set).length === 0) {
      const result = await this.dbCollection.findOne({ _id: postId, user_id: ownerUserId, deleted_at: null });
      return result ? this.mapper.toDomain(result) : null;
    }

    const result = await this.dbCollection.findOneAndUpdate(
      { _id: postId, user_id: ownerUserId, deleted_at: null },
      {
        $set: {
          ...$set,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }
}
