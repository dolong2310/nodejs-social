import { EPostAudience, EPostType } from '@/enums/posts.enum';
import { IPaginationRequestQuery } from '@/models/requests/common.request';
import { IMedia } from '@/types/media.type';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';

export interface ICreatePostRequestBody {
  type: EPostType;
  audience: EPostAudience;
  content: string;
  parentId: string | null; // chỉ null khi post là bài viết gốc, nếu parentId là string thì post đó là bài viết con
  hashtags: string[]; // tên hashtags dạng ['javascript', 'nodejs']
  mentions: string[]; // userId[]
  media: IMedia[];
}

export interface IGetPostDetailRequestParams extends ParamsDictionary {
  postId: string;
}

export interface IGetPostsRequestParams extends ParamsDictionary {
  postId: string;
  type: EPostType;
}

// Payload
export interface IGetNewFeedsPayload {
  userId: string;
  followedUserIds: ObjectId[];
  page: IPaginationRequestQuery['page'];
  limit: IPaginationRequestQuery['limit'];
}
