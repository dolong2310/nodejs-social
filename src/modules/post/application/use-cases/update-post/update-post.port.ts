import { UseCase } from '@/modules/core/application/base.usecase';
import { EPostAudience, EPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';

export class UpdatePostCommand {
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

export class UpdatePostResult implements PostFullProps {
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

export abstract class UpdatePostPort implements UseCase<UpdatePostCommand, UpdatePostResult> {
  abstract execute(command: UpdatePostCommand): Promise<UpdatePostResult>;
}
