import { IHashtag } from '@/models/schemas/hashtag.schema';
import { IPost } from '@/models/schemas/post.schema';
import { IUser } from '@/models/schemas/user.schema';

export interface PostDetailResponseDTO extends Omit<IPost, 'hashtags' | 'mentions'> {
  hashtags: IHashtag[];
  mentions: Pick<IUser, '_id' | 'name' | 'email' | 'username' | 'verificationStatus'>[];
  bookmarkCount: number;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
}

export interface PostNewFeedResponseDTO extends PostDetailResponseDTO {
  author: Pick<IUser, '_id' | 'name' | 'email' | 'username' | 'avatar'>;
}
