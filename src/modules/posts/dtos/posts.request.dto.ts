import { IMedia } from '@/interfaces/types/media.type';
import { EPostAudience, EPostType } from '@/modules/posts/posts.enum';
import { CursorPaginationQueryDTO } from '@/shared/dtos/common.request.dto';
import { ParamsDictionary } from 'express-serve-static-core';

export class CreatePostRequestDTO {
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: IMedia[];

  constructor(body: {
    type: EPostType;
    audience: EPostAudience;
    allowStrangerComments: boolean;
    content: string;
    parentId: string | null;
    hashtags: string[];
    mentions: string[];
    media: IMedia[];
  }) {
    this.type = body.type;
    this.audience = body.audience;
    this.allowStrangerComments = body.allowStrangerComments;
    this.content = body.content;
    this.parentId = body.parentId;
    this.hashtags = body.hashtags;
    this.mentions = body.mentions;
    this.media = body.media;
  }
}

/** Owner PATCH: both fields required (D-06). */
export class PatchPostRequestDTO {
  audience: EPostAudience;
  allowStrangerComments: boolean;

  constructor(body: { audience: EPostAudience; allowStrangerComments: boolean }) {
    this.audience = body.audience;
    this.allowStrangerComments = body.allowStrangerComments;
  }
}

export interface GetPostDetailParamsDTO extends ParamsDictionary {
  postId: string;
}

export interface GetPostsParamsDTO extends ParamsDictionary {
  postId: string;
  type: EPostType;
}

export interface GetNewFeedsPayloadDTO {
  userId: string;
  friendUserIds: string[];
  cursor?: CursorPaginationQueryDTO['cursor'];
  limit: CursorPaginationQueryDTO['limit'];
}
