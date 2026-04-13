import { IHashtag } from '@/domain/entities/hashtag.entity';
import { IPost } from '@/domain/entities/post.entity';
import { IUser } from '@/domain/entities/user.entity';
import { EPostAudience, EPostType } from '@/domain/enums/posts.enum';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';
import { Media } from '@/domain/value-objects/media.value-object';

export interface IIsViewerInteractedWithPostInput {
  postId: string;
  viewerId: string;
}

export interface IFindPostByIdInput {
  postId: string;
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

export interface IFindGuestPostsInput {
  cursor?: DateIdCursor;
  limit: number;
}

export interface ICountPostsInput {
  userId: string;
  friendUserIds: string[];
  blockedAuthorIds: string[];
  extraVisiblePostIds?: string[];
}

export interface IFindPostsTypeInput {
  postId: string;
  type: EPostType;
  cursor?: DateIdCursor;
  limit: number;
}

export interface ICountPostsTypeInput {
  postId: string;
  type: EPostType;
}

export interface IFindPostByIdInput {
  postId: string;
}

export interface IIncreasePostViewsInput {
  postId: string;
  userId?: string;
}

export interface ICreatePostInput {
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: Media[];
}

export interface IUpdatePostAudienceAndStrangerCommentsInput {
  postId: string;
  ownerUserId: string;
  audience: EPostAudience;
  allowStrangerComments: boolean;
}

export interface IIncreasePostsViewsInput {
  ids: string[];
  isAuthenticatedViewer: boolean;
}

export interface IFindAndUpsertHashtagsInput {
  hashtags: string[];
}

export interface IPostDetailOutput extends Omit<IPost, 'mentions' | 'hashtags'> {
  hashtags: IHashtag[];
  mentions: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'verificationStatus'>[];
  bookmarkCount: number;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
}

export interface IFindPostIdsWhereViewerInteractedWithAuthorsOutput {
  ids: string[];
}

export interface IPostDetailWithAuthorOutput extends IPostDetailOutput {
  author: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'avatar'>;
}
