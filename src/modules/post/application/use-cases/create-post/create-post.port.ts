import { UseCase } from '@/modules/core/application/base.usecase';
import { EPostAudience, EPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';

export class CreatePostCommand {
  userId: string;
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
  hashtags: string[];
  mentions: string[];
  media: Media[];
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
  type: EPostType;
  audience: EPostAudience;
  allowStrangerComments: boolean;
  content: string;
  parentId: string | null;
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
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export abstract class CreatePostPort implements UseCase<CreatePostCommand, CreatePostResult> {
  abstract execute(command: CreatePostCommand): Promise<CreatePostResult>;
}
