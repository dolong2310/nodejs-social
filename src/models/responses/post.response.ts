import { IHashtag } from '@/models/schemas/hashtag.schema';
import { IPost } from '@/models/schemas/post.schema';
import { IUser } from '@/models/schemas/user.schema';

export interface IPostDetailResponse extends Omit<IPost, 'hashtags' | 'mentions'> {
  hashtags: IHashtag[];
  mentions: Pick<IUser, '_id' | 'name' | 'email' | 'username' | 'verificationStatus'>[];
  bookmarkCount: number;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
  // totalViews: number;
}
