import type { BookmarkFullProps } from '@/modules/post/domain/entities/bookmark.types';
import type { HashtagFullProps } from '@/modules/post/domain/entities/hashtag.types';
import type { LikeFullProps } from '@/modules/post/domain/entities/like.types';
import type { EnumPostAudience, EnumPostType, PostFullProps } from '@/modules/post/domain/entities/post.types';
import type {
  PostAuthorPreview,
  PostDetailOutput,
  PostDetailWithAuthorOutput,
  PostMentionPreview
} from '@/modules/post/domain/repositories/post.query.types';
import type { IMedia } from '@/modules/post/domain/value-objects/media.value-object';

export class PostResponseDTO implements PostFullProps {
  id: string;
  userId: string;
  type: EnumPostType;
  audience: EnumPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: IMedia[];
  guestViews: number;
  userViews: number;
  createdAt: Date;
  updatedAt: Date;
  constructor(payload: PostFullProps) {
    this.id = payload.id;
    this.userId = payload.userId;
    this.type = payload.type;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
    this.content = payload.content;
    this.parentId = payload.parentId;
    this.hashtags = payload.hashtags;
    this.mentions = payload.mentions;
    this.media = payload.media;
    this.guestViews = payload.guestViews ?? 0;
    this.userViews = payload.userViews ?? 0;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export class PostDetailResponseDTO implements PostDetailOutput {
  id: string;
  userId: string;
  type: EnumPostType;
  audience: EnumPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: HashtagFullProps[];
  mentions: PostMentionPreview[];
  media: IMedia[];
  guestViews: number;
  userViews: number;
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  bookmarkCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
  sourcePost?: PostDetailWithAuthorResponseDTO | null;
  constructor(payload: PostDetailOutput) {
    this.id = payload.id;
    this.userId = payload.userId;
    this.type = payload.type;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
    this.content = payload.content;
    this.parentId = payload.parentId;
    this.hashtags = payload.hashtags;
    this.mentions = payload.mentions.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      username: m.username,
      status: m.status
    }));
    this.media = payload.media;
    this.guestViews = payload.guestViews ?? 0;
    this.userViews = payload.userViews ?? 0;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
    this.likeCount = payload.likeCount;
    this.bookmarkCount = payload.bookmarkCount;
    this.likedByMe = payload.likedByMe;
    this.bookmarkedByMe = payload.bookmarkedByMe;
    this.repostCount = payload.repostCount;
    this.commentCount = payload.commentCount;
    this.quoteCount = payload.quoteCount;
    this.sourcePost = payload.sourcePost ? new PostDetailWithAuthorResponseDTO(payload.sourcePost) : null;
  }
}

export class PostDetailWithAuthorResponseDTO implements PostDetailWithAuthorOutput {
  id: string;
  userId: string;
  type: EnumPostType;
  audience: EnumPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: HashtagFullProps[];
  mentions: PostMentionPreview[];
  media: IMedia[];
  guestViews: number;
  userViews: number;
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  bookmarkCount: number;
  likedByMe: boolean;
  bookmarkedByMe: boolean;
  repostCount: number;
  commentCount: number;
  quoteCount: number;
  author: PostAuthorPreview;
  sourcePost?: PostDetailWithAuthorResponseDTO | null;
  constructor(payload: PostDetailWithAuthorOutput) {
    this.id = payload.id;
    this.userId = payload.userId;
    this.type = payload.type;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
    this.content = payload.content;
    this.parentId = payload.parentId;
    this.hashtags = payload.hashtags;
    this.mentions = payload.mentions.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      username: m.username,
      status: m.status
    }));
    this.media = payload.media;
    this.guestViews = payload.guestViews ?? 0;
    this.userViews = payload.userViews ?? 0;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
    this.likeCount = payload.likeCount;
    this.bookmarkCount = payload.bookmarkCount;
    this.likedByMe = payload.likedByMe;
    this.bookmarkedByMe = payload.bookmarkedByMe;
    this.repostCount = payload.repostCount;
    this.commentCount = payload.commentCount;
    this.quoteCount = payload.quoteCount;
    this.author = payload.author;
    this.sourcePost = payload.sourcePost ? new PostDetailWithAuthorResponseDTO(payload.sourcePost) : null;
  }
}

export class CreateBookmarkResponseDTO implements BookmarkFullProps {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(bookmark: BookmarkFullProps) {
    this.id = bookmark.id;
    this.userId = bookmark.userId;
    this.postId = bookmark.postId;
    this.createdAt = bookmark.createdAt;
    this.updatedAt = bookmark.updatedAt;
  }
}

export class DeleteBookmarkResponseDTO extends CreateBookmarkResponseDTO {
  constructor(bookmark: BookmarkFullProps) {
    super(bookmark);
  }
}

export class CreateLikeResponseDTO implements LikeFullProps {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(like: LikeFullProps) {
    this.id = like.id;
    this.userId = like.userId;
    this.postId = like.postId;
    this.createdAt = like.createdAt;
    this.updatedAt = like.updatedAt;
  }
}

export class DeleteLikeResponseDTO extends CreateLikeResponseDTO {
  constructor(like: LikeFullProps) {
    super(like);
  }
}
