import { BookmarkFullProps } from '@/modules/post/domain/entities/bookmark.type';
import { HashtagFullProps } from '@/modules/post/domain/entities/hashtag.type';
import { LikeFullProps } from '@/modules/post/domain/entities/like.type';
import { EnumPostAudience, EnumPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';
import {
  PostAuthorPreview,
  PostDetailOutput,
  PostDetailWithAuthorOutput,
  PostMentionPreview
} from '@/modules/post/domain/repositories/post.query.type';
import { IMedia } from '@/modules/post/domain/value-objects/media.value-object';

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
  repostCount: number;
  commentCount: number;
  quoteCount: number;
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
    this.repostCount = payload.repostCount;
    this.commentCount = payload.commentCount;
    this.quoteCount = payload.quoteCount;
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
  repostCount: number;
  commentCount: number;
  quoteCount: number;
  author: PostAuthorPreview;
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
    this.repostCount = payload.repostCount;
    this.commentCount = payload.commentCount;
    this.quoteCount = payload.quoteCount;
    this.author = payload.author;
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
