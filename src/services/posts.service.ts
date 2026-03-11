import { ICreatePostRequestBody } from '@/models/requests/post.request';
import HashtagSchema, { IHashtag } from '@/models/schemas/hashtag.schema';
import PostSchema from '@/models/schemas/post.schema';
import databaseService from '@/services/database.service';
import { ObjectId, WithId } from 'mongodb';

class PostsService {
  constructor() {}

  findPostById(postId: string) {
    return databaseService.posts.findOne({ _id: new ObjectId(postId) });
  }

  findAndUpsertHashtags(hashtags: string[]): Promise<(WithId<IHashtag> | null)[]> {
    return Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new HashtagSchema({ name: hashtag }) },
          { upsert: true, returnDocument: 'after' }
        );
      })
    );
  }

  async createPost({ userId, body }: { userId: string; body: ICreatePostRequestBody }) {
    const { type, audience, content, parentId, hashtags: hashtagsBody, mentions, media } = body;

    const hashtags = await this.findAndUpsertHashtags(hashtagsBody);
    const hashtagIds = hashtags.filter(Boolean).map((hashtag) => hashtag!._id);

    const newPost = new PostSchema({
      userId: new ObjectId(userId),
      type,
      audience,
      content,
      parentId: parentId ? new ObjectId(parentId) : null,
      hashtags: hashtagIds,
      mentions: mentions.map((mention) => new ObjectId(mention)),
      media,
      guestViews: 0,
      userViews: 0
    });
    await databaseService.posts.insertOne(newPost);

    return newPost;
  }
}

export default new PostsService();
