import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import {
  CreatePostInput,
  DeletePostTreeInput,
  UpdatePostInput
} from '@/modules/post/domain/repositories/post.repository.type';
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

  async deletePostTree({ postId, actorId }: DeletePostTreeInput): Promise<number> {
    return this.transaction(async () => {
      const ids = await this.collectActivePostTreeIds(postId);
      if (ids.length === 0) {
        return 0;
      }

      const deletedAt = new Date();
      const audit = {
        deleted_at: deletedAt,
        deleted_by_id: actorId,
        updated_at: deletedAt,
        updated_by_id: actorId
      };

      const postsResult = await this.dbCollection.updateMany(
        { _id: { $in: ids }, deleted_at: null },
        { $set: audit },
        { session: this.session }
      );
      await Promise.all([
        this.db
          .collection('likes')
          .updateMany({ post_id: { $in: ids }, deleted_at: null }, { $set: audit }, { session: this.session }),
        this.db
          .collection('bookmarks')
          .updateMany({ post_id: { $in: ids }, deleted_at: null }, { $set: audit }, { session: this.session })
      ]);

      return postsResult.modifiedCount;
    });
  }

  private async collectActivePostTreeIds(postId: string): Promise<string[]> {
    const root = await this.dbCollection.findOne(
      { _id: postId, deleted_at: null },
      { projection: { _id: 1 }, session: this.session }
    );
    if (!root) {
      return [];
    }

    const ids: string[] = [postId];
    const seen = new Set(ids);
    let frontier = [postId];

    while (frontier.length > 0) {
      const children = await this.dbCollection
        .find(
          {
            parent_id: { $in: frontier }
          },
          { projection: { _id: 1 }, session: this.session }
        )
        .toArray();

      frontier = [];
      for (const child of children) {
        const id = child._id;
        if (seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
        frontier.push(id);
      }
    }

    return ids;
  }
}
