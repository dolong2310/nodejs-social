import { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import {
  IIncreasePostsViewsInput,
  IIncreasePostViewsInput,
  IIncreasePostViewsOutput,
  IPublishPostInput,
  IPublishPostOutput
} from '@/modules/post/domain/repositories/post.command.type';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostMapper } from '@/modules/post/infrastructure/persistence/mongo/post.mapper';
import { PostModel } from '@/modules/post/infrastructure/persistence/mongo/post.model';
import { Collection, Db, MongoClient } from 'mongodb';

type PostSideDocument = {
  _id: string;
  [key: string]: unknown;
};

type PostCounterDocument = {
  _id: string;
  post_id: string;
  guest_views: number;
  user_views: number;
  created_at: Date;
  updated_at: Date;
};

export class PostCommandRepository implements PostCommandRepositoryPort {
  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: PostMapper
  ) {}

  get dbCollection(): Collection<PostModel> {
    return this.db.collection<PostModel>('posts');
  }

  get postHashtagsCollection(): Collection<PostSideDocument> {
    return this.db.collection('post_hashtags');
  }

  get postMentionsCollection(): Collection<PostSideDocument> {
    return this.db.collection('post_mentions');
  }

  get postMediaCollection(): Collection<PostSideDocument> {
    return this.db.collection('post_media');
  }

  get postCountersCollection(): Collection<PostCounterDocument> {
    return this.db.collection('post_counters');
  }

  async publishPost({
    hashtagIds,
    mentionedUserIds,
    media,
    ...postInput
  }: IPublishPostInput): Promise<IPublishPostOutput> {
    const entity = PostEntity.create(postInput);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    await Promise.all([
      this.insertPostCounters(record._id),
      this.insertPostHashtags(record._id, hashtagIds),
      this.insertPostMentions(record._id, mentionedUserIds),
      this.insertPostMedia(record._id, media)
    ]);
    return entity.toObject<IPublishPostOutput>();
  }

  async increasePostViews({ postId, userId }: IIncreasePostViewsInput): Promise<IIncreasePostViewsOutput | null> {
    const result = await this.postCountersCollection.findOneAndUpdate(
      { post_id: postId },
      { $inc: userId ? { user_views: 1 } : { guest_views: 1 }, $currentDate: { updated_at: true } },
      { returnDocument: 'after', projection: { user_views: 1, guest_views: 1, updated_at: 1 } }
    );
    return result
      ? {
          userViews: Number(result.user_views ?? 0),
          guestViews: Number(result.guest_views ?? 0),
          updatedAt: result.updated_at
        }
      : null;
  }

  async increasePostsViews({ ids, isAuthenticatedViewer }: IIncreasePostsViewsInput): Promise<number> {
    if (ids.length === 0) return 0;
    const res = await this.postCountersCollection.updateMany(
      { post_id: { $in: ids } },
      {
        $inc: isAuthenticatedViewer ? { user_views: 1 } : { guest_views: 1 },
        $currentDate: { updated_at: true }
      }
    );
    return res.modifiedCount;
  }

  private async insertPostCounters(postId: string): Promise<void> {
    await this.postCountersCollection.insertOne({
      _id: `${postId}:counters`,
      post_id: postId,
      guest_views: 0,
      user_views: 0,
      created_at: new Date(),
      updated_at: new Date()
    });
  }

  private async insertPostHashtags(postId: string, hashtagIds: string[]): Promise<void> {
    const ids = this.uniqueOrdered(hashtagIds);
    if (ids.length === 0) return;
    await this.postHashtagsCollection.insertMany(
      ids.map((hashtagId, position) => ({
        _id: `${postId}:hashtag:${hashtagId}`,
        post_id: postId,
        hashtag_id: hashtagId,
        position
      }))
    );
  }

  private async insertPostMentions(postId: string, mentionedUserIds: string[]): Promise<void> {
    const ids = this.uniqueOrdered(mentionedUserIds);
    if (ids.length === 0) return;
    await this.postMentionsCollection.insertMany(
      ids.map((mentionedUserId, position) => ({
        _id: `${postId}:mention:${mentionedUserId}`,
        post_id: postId,
        mentioned_user_id: mentionedUserId,
        position
      }))
    );
  }

  private async insertPostMedia(postId: string, mediaItems: IPublishPostInput['media']): Promise<void> {
    if (mediaItems.length === 0) return;
    await this.postMediaCollection.insertMany(
      mediaItems.map((media, position) => {
        const raw = media.raw();
        return {
          _id: `${postId}:media:${position}`,
          post_id: postId,
          url: raw.url,
          type: raw.type,
          position,
          created_at: new Date(),
          updated_at: new Date()
        };
      })
    );
  }

  private uniqueOrdered(ids: string[]): string[] {
    return [...new Set(ids)];
  }
}
