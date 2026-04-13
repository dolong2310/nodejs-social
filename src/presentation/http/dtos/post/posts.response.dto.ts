import { ICursorPaginationResult } from '@/application/common/interfaces/cursor-pagination-result.interface';
import { IHashtag } from '@/domain/entities/hashtag.entity';
import { IUser } from '@/domain/entities/user.entity';
import { EPostAudience, EPostType } from '@/domain/enums/posts.enum';
import { Media } from '@/domain/value-objects/media.value-object';

export class PostResponseDTO {
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

export class PostDetailResponseDTO {
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

export class PostDetailPaginationResponseDTO implements ICursorPaginationResult<PostDetailResponseDTO> {
  items: PostDetailResponseDTO[];
  nextCursor: string | null;
  constructor(payload: { items: PostDetailResponseDTO[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export class IncrementViewsResponseDTO {
  userViews: number;
  guestViews: number;
  updatedAt?: Date;
  constructor(payload: { userViews: number; guestViews: number; updatedAt?: Date }) {
    this.userViews = payload.userViews;
    this.guestViews = payload.guestViews;
    this.updatedAt = payload.updatedAt;
  }
}

export class HasViewerEngagedWithPostResponseDTO {
  value: boolean;
  constructor(isInteracted: boolean) {
    this.value = isInteracted;
  }
}

export class GetExtraVisiblePostIdsForBlockedEngagementResponseDTO {
  value: string[];
  constructor(extraVisiblePostIds: string[]) {
    this.value = extraVisiblePostIds;
  }
}

export class ListBlockedUserIdsEitherDirectionCachedResponseDTO {
  value: string[];
  constructor(blockedUserIds: string[]) {
    this.value = blockedUserIds;
  }
}

export class PostNewFeedResponseDTO extends PostDetailResponseDTO {
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

export class PostNewFeedPaginationResponseDTO implements ICursorPaginationResult<PostNewFeedResponseDTO> {
  items: PostNewFeedResponseDTO[];
  nextCursor: string | null;
  constructor(payload: { items: PostNewFeedResponseDTO[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export class FindAndUpsertHashtagsResponseDTO {
  value: (IHashtag | null)[];
  constructor(hashtags: (IHashtag | null)[]) {
    this.value = hashtags;
  }
}

// import { IPost } from '@/domain/entities/posts.entity';
// import { IUser } from '@/domain/entities/users.entity';
// import { IHashtag } from '@/domain/entities/hashtag.entity';

// export interface PostDetailResponseDTO extends Omit<IPost, 'hashtags' | 'mentions'> {
//   hashtags: IHashtag[];
//   mentions: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'verificationStatus'>[];
//   bookmarkCount: number;
//   repostCount: number;
//   commentCount: number;
//   quoteCount: number;
// }

// export interface PostNewFeedResponseDTO extends PostDetailResponseDTO {
//   author: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'avatar'>;
// }
