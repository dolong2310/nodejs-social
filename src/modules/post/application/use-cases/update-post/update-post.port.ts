import { UseCase } from '@/modules/core/application/base.usecase';
import { EnumPostAudience, EnumPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';
import { Media } from '@/modules/post/domain/value-objects/media.value-object';

export class UpdatePostCommand {
  userId: string;
  postId: string;
  audience: EnumPostAudience;
  allowStrangerComments: boolean;
  constructor(payload: { userId: string; postId: string; audience: EnumPostAudience; allowStrangerComments: boolean }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
    this.audience = payload.audience;
    this.allowStrangerComments = payload.allowStrangerComments;
  }
}

export class UpdatePostResult implements PostFullProps {
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

export abstract class UpdatePostPort implements UseCase<UpdatePostCommand, UpdatePostResult> {
  abstract execute(command: UpdatePostCommand): Promise<UpdatePostResult>;
}
