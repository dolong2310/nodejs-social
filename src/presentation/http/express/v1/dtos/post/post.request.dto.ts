import { CreatePostProps, EPostAudience, EPostType } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/core/domain/value-objects/media.value-object';
import { ParamsDictionary } from 'express-serve-static-core';

export class CreatePostRequestDTO implements Omit<CreatePostProps, 'userId' | 'guestViews' | 'userViews'> {
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
    this.media = payload.media;
  }
}

export class PatchPostRequestDTO {
  audience: EPostAudience;
  allowStrangerComments: boolean;

  constructor(payload: { audience: EPostAudience; allowStrangerComments: boolean }) {
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
  }
}

export interface GetPostDetailParamsDTO extends ParamsDictionary {
  postId: string;
}

export interface GetPostsParamsDTO extends ParamsDictionary {
  postId: string;
  type: EPostType;
}
