import { ESearchPeople, ESearchType } from '@/modules/common/domain/enums/search.enum';
import { DateIdCursor } from '@/modules/common/domain/value-objects/date-id-cursor.value-object';
import { HashtagFullProps } from '@/modules/post/domain/entities/hashtag.type';
import { EPostAudience, EPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';
import { UserFullProps } from '@/modules/user/domain/entities/user.type';
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

export interface IPostAccessSnapshot {
  id: string;
  userId: string;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  mentionedUserIds: string[];
}

export interface IPostDetailOutput extends PostFullProps {
  hashtags: HashtagFullProps[];
  mentions: Prettify<Pick<UserFullProps, 'id' | 'name' | 'email' | 'username' | 'status'>>[];
  media: Media[];
  guestViews: number;
  userViews: number;
  bookmarkCount: number;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
}

export interface IPostDetailWithAuthorOutput extends IPostDetailOutput {
  author: Prettify<Pick<UserFullProps, 'id' | 'name' | 'email' | 'username' | 'avatar'>>;
}
