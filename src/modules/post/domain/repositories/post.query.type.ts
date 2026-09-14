import { EnumSearchPeople, EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import { HashtagFullProps } from '@/modules/post/domain/entities/hashtag.type';
import { EnumPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';
import { Prettify } from 'ts-essentials';

export interface IsUserInteractedWithPostInput {
  postId: string;
  userId: string;
}

export interface FindGuestPostsInput {
  cursor?: DateIdCursor;
  limit: number;
}

export interface FindPostIdsWhereUserInteractedWithAuthorsInput {
  userId: string;
  authorIds: string[];
}

export type PostUserInteractionType = 'likes' | 'bookmarks';

export interface FindPostsInput {
  userId: string;
  friendUserIds: string[];
  blockedAuthorIds: string[];
  extraVisiblePostIds?: string[];
  authorUserIds?: string[];
  cursor?: DateIdCursor;
  limit: number;
}

export interface FindPostsByUserIdInput {
  targetUserId: string;
  currentUserId?: string;
  type?: EnumPostType;
  canViewFriendsOnly: boolean;
  includeOnlyMe: boolean;
  cursor?: DateIdCursor;
  limit: number;
}

export interface FindPostsTypeInput {
  postId: string;
  type: EnumPostType;
  currentUserId?: string;
  cursor?: DateIdCursor;
  limit: number;
}

export interface FindPostsByUserInteractionInput {
  currentUserId: string;
  interaction: PostUserInteractionType;
  friendUserIds: string[];
  blockedAuthorIds: string[];
  extraVisiblePostIds?: string[];
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
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
  sourcePost?: PostDetailWithAuthorOutput | null;
}

export interface PostDetailWithAuthorOutput extends PostDetailOutput {
  author: PostAuthorPreview;
}
