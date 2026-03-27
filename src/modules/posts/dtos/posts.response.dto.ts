import { IPost, IUser } from '@/modules';
import { IHashtag } from '@/shared';

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
