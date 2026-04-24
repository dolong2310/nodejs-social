import { LoggerPort } from '@/application/ports/logger.port';
import { PostEntity } from '@/domain/entities/post/post.entity';
import { PostRepositoryPort } from '@/domain/repositories/post/post.repository';
import {
  ICreatePostInput,
  IIncreasePostsViewsInput,
  IIncreasePostViewsInput,
  IUpdatePostAudienceAndStrangerCommentsInput
} from '@/domain/repositories/post/post.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { PostMapper } from '@/infrastructure/persistence/repositories/post/post.mapper';
import { PostModel } from '@/infrastructure/persistence/repositories/post/post.model';
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
    const result = await this.dbCollection.findOne({ _id: id });
    return result ? this.mapper.toDomain(result) : null;
  }

  async createPost(data: ICreatePostInput): Promise<PostEntity> {
    const entity = PostEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    return this.mapper.toDomain(record);
  }

  async updatePostAudienceAndStrangerComments(
    data: IUpdatePostAudienceAndStrangerCommentsInput
  ): Promise<PostEntity | null> {
    const { postId, ownerUserId, audience, allowStrangerComments } = data;
    const result = await this.dbCollection.findOneAndUpdate(
      { _id: postId, userId: ownerUserId },
      {
        $set: {
          audience,
          allowStrangerComments,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async increasePostViews({ postId, userId }: IIncreasePostViewsInput): Promise<PostEntity | null> {
    const result = await this.dbCollection.findOneAndUpdate(
      { _id: postId },
      { $inc: userId ? { userViews: 1 } : { guestViews: 1 }, $currentDate: { updatedAt: true } },
      { returnDocument: 'after', projection: { userViews: 1, guestViews: 1, updatedAt: 1 } }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async increasePostsViews({ ids, isAuthenticatedViewer }: IIncreasePostsViewsInput): Promise<number> {
    if (ids.length === 0) return 0;
    const res = await this.dbCollection.updateMany(
      { _id: { $in: ids } },
      {
        $inc: isAuthenticatedViewer ? { userViews: 1 } : { guestViews: 1 },
        $currentDate: { updatedAt: true }
      }
    );
    return res.modifiedCount;
  }
}
