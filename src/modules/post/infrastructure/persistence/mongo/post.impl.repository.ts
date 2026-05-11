import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import {
  ICreatePostInput,
  IUpdatePostAudienceAndStrangerCommentsInput
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
    const result = await this.dbCollection.findOne({ _id: id });
    return result ? this.mapper.toDomain(result) : null;
  }

  async createPost(data: ICreatePostInput): Promise<PostEntity> {
    const entity = PostEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    return entity;
  }

  async updatePostAudienceAndStrangerComments(
    data: IUpdatePostAudienceAndStrangerCommentsInput
  ): Promise<PostEntity | null> {
    const { postId, ownerUserId, audience, allowStrangerComments } = data;
    const result = await this.dbCollection.findOneAndUpdate(
      { _id: postId, user_id: ownerUserId },
      {
        $set: {
          audience,
          allow_stranger_comments: allowStrangerComments,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }
}
