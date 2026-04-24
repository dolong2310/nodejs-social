import { HashtagFullProps } from '@/domain/entities/hashtag/hashtag.type';
import { EPostType, PostFullProps } from '@/domain/entities/post/post.type';
import { UserFullProps } from '@/domain/entities/user/user.type';
import { ESearchPeople, ESearchType } from '@/domain/enums/search.enum';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';
import { Prettify } from 'ts-essentials';

export interface IIsViewerInteractedWithPostInput {
  postId: string;
  viewerId: string;
}

export interface IFindGuestPostsInput {
  cursor?: DateIdCursor;
  limit: number;
}

export interface IFindPostIdsWhereViewerInteractedWithAuthorsInput {
  viewerId: string;
  authorIds: string[];
}

export interface IFindPostsInput {
  userId: string;
  friendUserIds: string[];
  blockedAuthorIds: string[];
  extraVisiblePostIds?: string[];
  cursor?: DateIdCursor;
  limit: number;
}

export interface IFindPostsTypeInput {
  postId: string;
  type: EPostType;
  cursor?: DateIdCursor;
  limit: number;
}

export interface IFindPostsForSearchInput {
  userId?: string;
  query: string;
  type?: ESearchType;
  people?: ESearchPeople;
  limit: number;
  cursor?: DateIdCursor;
  findFriendUserIds(userId: string): Promise<string[]>;
  blockedAuthorIds?: string[];
  extraVisiblePostIds?: string[];
}

// Output

export interface IPostDetailOutput extends Omit<PostFullProps, 'mentions' | 'hashtags'> {
  hashtags: HashtagFullProps[];
  mentions: Prettify<Pick<UserFullProps, 'id' | 'name' | 'email' | 'username' | 'status'>>[];
  bookmarkCount: number;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
}

export interface IPostDetailWithAuthorOutput extends IPostDetailOutput {
  author: Prettify<Pick<UserFullProps, 'id' | 'name' | 'email' | 'username' | 'avatar'>>;
}
