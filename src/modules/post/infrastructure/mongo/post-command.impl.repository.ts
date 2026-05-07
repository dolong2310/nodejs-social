import { PostCommandRepositoryPort } from '@/modules/post/application/ports/command/post-command.repository';
import {
  IIncreasePostsViewsInput,
  IIncreasePostViewsInput,
  IIncreasePostViewsOutput
} from '@/modules/post/application/ports/command/post-command.type';
import { PostModel } from '@/modules/post/infrastructure/mongo/post.model';
import { PostMapper } from '@/modules/post/infrastructure/mongo/post.mapper';
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

  async increasePostViews({ postId, userId }: IIncreasePostViewsInput): Promise<IIncreasePostViewsOutput | null> {
    const result = await this.dbCollection.findOneAndUpdate(
      { _id: postId },
      { $inc: userId ? { userViews: 1 } : { guestViews: 1 }, $currentDate: { updatedAt: true } },
      { returnDocument: 'after', projection: { userViews: 1, guestViews: 1, updatedAt: 1 } }
    );
    return result
      ? {
          userViews: result.userViews,
          guestViews: result.guestViews,
          updatedAt: result.updatedAt
        }
      : null;
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
