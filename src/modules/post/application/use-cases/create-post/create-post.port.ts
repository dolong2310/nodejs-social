import { UseCase } from '@/modules/core/application/base.usecase';
import {
  CreatePostProps,
  EnumPostAudience,
  EnumPostType,
  PostFullProps
} from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';

export class CreatePostCommand implements CreatePostProps {
  userId: string;
  type: EnumPostType;
  audience: EnumPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: Media[];
  constructor(payload: CreatePostProps) {
    this.userId = payload.userId;
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

export class CreatePostResult implements PostFullProps {
  id: string;
  userId: string;
  type: EnumPostType;
  audience: EnumPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: Media[];
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

export abstract class CreatePostPort implements UseCase<CreatePostCommand, CreatePostResult> {
  abstract execute(command: CreatePostCommand): Promise<CreatePostResult>;
}
