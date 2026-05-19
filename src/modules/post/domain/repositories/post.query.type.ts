import { EnumSearchPeople, EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import { HashtagFullProps } from '@/modules/post/domain/entities/hashtag.type';
import { EnumPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';
import { Prettify } from 'ts-essentials';

export interface IsViewerInteractedWithPostInput {
  postId: string;
  viewerId: string;
}

export interface FindGuestPostsInput {
  cursor?: DateIdCursor;
  limit: number;
}

export interface FindPostIdsWhereViewerInteractedWithAuthorsInput {
  viewerId: string;
  authorIds: string[];
}

export interface FindPostsInput {
  userId: string;
  friendUserIds: string[];
  blockedAuthorIds: string[];
  extraVisiblePostIds?: string[];
  cursor?: DateIdCursor;
  limit: number;
}

export interface FindPostsTypeInput {
  postId: string;
  type: EnumPostType;
  cursor?: DateIdCursor;
  limit: number;
}

export interface FindPostsForSearchInput {
  userId?: string;
  query: string;
  type?: EnumSearchType;
  people?: EnumSearchPeople;
  limit: number;
  cursor?: DateIdCursor;
  findFriendUserIds(userId: string): Promise<string[]>;
  blockedAuthorIds?: string[];
  extraVisiblePostIds?: string[];
}

// Output

// reference from UserFullProps
type PostMentionUserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'UNKNOWN'; // EnumUserStatus
export type PostAuthorPreview = Prettify<{
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
}>;
export type PostMentionPreview = Prettify<{
  id: string;
  name: string;
  email: string;
  username?: string;
  status: PostMentionUserStatus;
}>;

export interface PostDetailOutput extends Omit<PostFullProps, 'mentions' | 'hashtags'> {
  hashtags: HashtagFullProps[];
  mentions: PostMentionPreview[];
  likeCount: number;
  bookmarkCount: number;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
}

export interface PostDetailWithAuthorOutput extends PostDetailOutput {
  author: PostAuthorPreview;
}
