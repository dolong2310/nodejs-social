import { EPostAudience, EPostType } from '@/domain/enums/posts.enum';
import { Media } from '@/domain/value-objects/media.value-object';

import { CursorPaginationQueryDTO, UserIdPayloadDTO } from '@/application/dtos/common/common.payload.dto';
import { PostDetailResultDTO, PostNewFeedResultDTO } from '@/application/dtos/post/post.result.dto';

export class FindPostDetailPayloadDTO {
  postId: string;
  constructor(payload: { postId: string }) {
    this.postId = payload.postId;
  }
}

export class FindPostByIdPayloadDTO extends FindPostDetailPayloadDTO {
  constructor(payload: { postId: string }) {
    super(payload);
  }
}

export class GetNewFeedsPayloadDTO extends CursorPaginationQueryDTO {
  userId: string;
  constructor(payload: { userId: string; limit: string; cursor?: string }) {
    super({ limit: payload.limit, cursor: payload.cursor });
    this.userId = payload.userId;
  }
}

export class GetPostsTypePayloadDTO extends CursorPaginationQueryDTO {
  userId?: string;
  postId: string;
  type: EPostType;
  constructor(payload: { userId?: string; postId: string; type: EPostType; limit: string; cursor?: string }) {
    super({ limit: payload.limit, cursor: payload.cursor });
    this.userId = payload.userId;
    this.postId = payload.postId;
    this.type = payload.type;
  }
}

export class FindAndUpsertHashtagsPayloadDTO {
  hashtags: string[];
  constructor(payload: { hashtags: string[] }) {
    this.hashtags = payload.hashtags;
  }
}

export class IncreaseViewsPayloadDTO {
  userId?: string;
  postId: string;
  constructor(payload: { userId?: string; postId: string }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
  }
}

class CreatePostRequestDTO {
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: Media[];
  constructor(payload: {
    type: EPostType;
    audience: EPostAudience;
    allowStrangerComments: boolean;
    content: string;
    parentId: string | null;
    hashtags: string[];
    mentions: string[];
    media: Media[];
  }) {
    this.type = payload.type;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
    this.content = payload.content;
    this.parentId = payload.parentId;
    this.hashtags = payload.hashtags;
    this.mentions = payload.mentions;
    this.media = payload.media.map((m) => Media.create({ url: m.url, type: m.type }));
  }
}

export class CreatePostPayloadDTO extends CreatePostRequestDTO {
  userId: string;
  constructor(payload: {
    userId: string;
    type: EPostType;
    audience: EPostAudience;
    allowStrangerComments: boolean;
    content: string;
    parentId: string | null;
    hashtags: string[];
    mentions: string[];
    media: Media[];
  }) {
    super({
      type: payload.type,
      audience: payload.audience,
      allowStrangerComments: payload.allowStrangerComments,
      content: payload.content,
      parentId: payload.parentId,
      hashtags: payload.hashtags,
      mentions: payload.mentions,
      media: payload.media
    });
    this.userId = payload.userId;
  }
}

export class PatchPostPayloadDTO {
  userId: string;
  postId: string;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  constructor(payload: { userId: string; postId: string; audience: EPostAudience; allowStrangerComments: boolean }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
  }
}

export class UpdatePostsViewsPayloadDTO<T extends PostDetailResultDTO | PostNewFeedResultDTO> {
  posts: T[];
  userId?: string;
  constructor(payload: { posts: T[]; userId?: string }) {
    this.posts = payload.posts;
    this.userId = payload.userId;
  }
}

export class IsViewerInteractedWithPostPayloadDTO {
  viewerId: string;
  postId: string;
  constructor(payload: { viewerId: string; postId: string }) {
    this.viewerId = payload.viewerId;
    this.postId = payload.postId;
  }
}

export class GetExtraVisiblePostIdsForBlockedEngagementPayloadDTO {
  userId: string;
  blockedAuthorIds: string[];
  constructor(payload: { userId: string; blockedAuthorIds: string[] }) {
    this.userId = payload.userId;
    this.blockedAuthorIds = payload.blockedAuthorIds;
  }
}

export class ListBlockedUserIdsEitherDirectionCachedPayloadDTO extends UserIdPayloadDTO {}
