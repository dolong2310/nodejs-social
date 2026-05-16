import { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import {
  IncreasePostsViewsInput,
  IncreasePostViewsInput,
  IncreasePostViewsOutput
} from '@/modules/post/domain/repositories/post.command.type';
import { PostMapper } from '@/modules/post/infrastructure/persistence/mongo/post.mapper';
import { PostModel } from '@/modules/post/infrastructure/persistence/mongo/post.model';
import { Collection, Db, MongoClient } from 'mongodb';

export class PostCommandRepository implements PostCommandRepositoryPort {
  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: PostMapper
  ) {}

  get dbCollection(): Collection<PostModel> {
    return this.db.collection<PostModel>('posts');
  }

  async increasePostViews({ postId, userId }: IncreasePostViewsInput): Promise<IncreasePostViewsOutput | null> {
    const result = await this.dbCollection.findOneAndUpdate(
      { _id: postId, deleted_at: null },
      { $inc: userId ? { user_views: 1 } : { guest_views: 1 }, $currentDate: { updated_at: true } },
      { returnDocument: 'after', projection: { user_views: 1, guest_views: 1, updated_at: 1 } }
    );
    return result
      ? {
          userViews: result.user_views,
          guestViews: result.guest_views,
          updatedAt: result.updated_at
        }
      : null;
  }

  async increasePostsViews({ ids, isAuthenticatedViewer }: IncreasePostsViewsInput): Promise<number> {
    if (ids.length === 0) return 0;
    const res = await this.dbCollection.updateMany(
      { _id: { $in: ids }, deleted_at: null },
      {
        $inc: isAuthenticatedViewer ? { user_views: 1 } : { guest_views: 1 },
        $currentDate: { updated_at: true }
      }
    );
    return res.modifiedCount;
  }
}
