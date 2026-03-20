import { PaginationQueryDTO } from '@/dtos/requests/common.request.dto';
import { EPostAudience, EPostType } from '@/enums/posts.enum';
import { IMedia } from '@/types/media.type';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';

export class CreatePostRequestDTO {
  type: EPostType;
  audience: EPostAudience;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: IMedia[];

  constructor(body: {
    type: EPostType;
    audience: EPostAudience;
    content: string;
    parentId: string | null;
    hashtags: string[];
    mentions: string[];
    media: IMedia[];
  }) {
    this.type = body.type;
    this.audience = body.audience;
    this.content = body.content;
    this.parentId = body.parentId;
    this.hashtags = body.hashtags;
    this.mentions = body.mentions;
    this.media = body.media;
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
  followedUserIds: ObjectId[];
  page: PaginationQueryDTO['page'];
  limit: PaginationQueryDTO['limit'];
}
