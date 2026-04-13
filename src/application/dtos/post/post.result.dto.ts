import { IHashtag } from '@/domain/entities/hashtag.entity';
import { IUser } from '@/domain/entities/user.entity';
import { EPostAudience, EPostType } from '@/domain/enums/posts.enum';
import { IPostDetailOutput } from '@/domain/repositories/post/post.interface';
import { Media } from '@/domain/value-objects/media.value-object';

import { ICursorPaginationResult } from '@/application/common/interfaces/cursor-pagination-result.interface';

export class PostResultDTO {
  id: string;
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: Media[];
  guestViews: number;
  userViews: number;
  createdAt?: Date;
  updatedAt?: Date;
  constructor(payload: {
    id: string;
    userId: string;
    type: EPostType;
    audience: EPostAudience;
    allowStrangerComments: boolean;
    content: string;
    parentId: string | null;
    hashtags: string[];
    mentions: string[];
    media: Media[];
    guestViews: number;
    userViews: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = payload.id;
    this.userId = payload.userId;
    this.type = payload.type;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
    this.content = payload.content;
    this.parentId = payload.parentId;
    this.hashtags = payload.hashtags;
    this.mentions = payload.mentions;
    this.media = payload.media.map((m) => Media.create({ url: m.url, type: m.type }));
    this.guestViews = payload.guestViews;
    this.userViews = payload.userViews;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export class PostDetailResultDTO implements IPostDetailOutput {
  id: string;
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: IHashtag[];
  mentions: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'verificationStatus'>[];
  media: Media[];
  guestViews: number;
  userViews: number;
  createdAt?: Date;
  updatedAt?: Date;
  bookmarkCount: number;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
  constructor(payload: {
    id: string;
    userId: string;
    type: EPostType;
    audience: EPostAudience;
    allowStrangerComments: boolean;
    content: string;
    parentId: string | null;
    hashtags: IHashtag[];
    mentions: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'verificationStatus'>[];
    media: Media[];
    guestViews: number;
    userViews: number;
    createdAt?: Date;
    updatedAt?: Date;
    bookmarkCount: number;
    repostCount: number;
    commentCount: number;
    quoteCount: number;
  }) {
    this.id = payload.id;
    this.userId = payload.userId;
    this.type = payload.type;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
    this.content = payload.content;
    this.parentId = payload.parentId;
    this.hashtags = payload.hashtags;
    this.mentions = payload.mentions;
    this.media = payload.media.map((m) => Media.create({ url: m.url, type: m.type }));
    this.guestViews = payload.guestViews;
    this.userViews = payload.userViews;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
    this.bookmarkCount = payload.bookmarkCount;
    this.repostCount = payload.repostCount;
    this.commentCount = payload.commentCount;
    this.quoteCount = payload.quoteCount;
  }
}

export class PostDetailPaginationResultDTO implements ICursorPaginationResult<PostDetailResultDTO> {
  items: PostDetailResultDTO[];
  nextCursor: string | null;
  constructor(payload: { items: PostDetailResultDTO[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export class IncrementViewsResultDTO {
  userViews: number;
  guestViews: number;
  updatedAt?: Date;
  constructor(payload: { userViews: number; guestViews: number; updatedAt?: Date }) {
    this.userViews = payload.userViews;
    this.guestViews = payload.guestViews;
    this.updatedAt = payload.updatedAt;
  }
}

export class IsViewerInteractedWithPostResultDTO {
  isInteracted: boolean;
  constructor(isInteracted: boolean) {
    this.isInteracted = isInteracted;
  }
}

export class GetExtraVisiblePostIdsForBlockedEngagementResultDTO {
  extraVisiblePostIds: string[];
  constructor(extraVisiblePostIds: string[]) {
    this.extraVisiblePostIds = extraVisiblePostIds;
  }
}

export class ListBlockedUserIdsEitherDirectionCachedResultDTO {
  blockedUserIds: string[];
  constructor(blockedUserIds: string[]) {
    this.blockedUserIds = blockedUserIds;
  }
}

export class PostNewFeedResultDTO extends PostDetailResultDTO {
  author: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'avatar'>;
  constructor(payload: {
    id: string;
    userId: string;
    type: EPostType;
    audience: EPostAudience;
    allowStrangerComments: boolean;
    content: string;
    parentId: string | null;
    hashtags: IHashtag[];
    mentions: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'verificationStatus'>[];
    media: Media[];
    guestViews: number;
    userViews: number;
    createdAt?: Date;
    updatedAt?: Date;
    bookmarkCount: number;
    repostCount: number;
    commentCount: number;
    quoteCount: number;
    author: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'avatar'>;
  }) {
    super(payload);
    this.author = payload.author;
  }
}

export class PostNewFeedPaginationResultDTO implements ICursorPaginationResult<PostNewFeedResultDTO> {
  items: PostNewFeedResultDTO[];
  nextCursor: string | null;
  constructor(payload: { items: PostNewFeedResultDTO[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export class FindAndUpsertHashtagsResultDTO {
  hashtags: (IHashtag | null)[];
  constructor(hashtags: (IHashtag | null)[]) {
    this.hashtags = hashtags;
  }
}
