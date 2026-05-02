import { UseCase } from '@/modules/core/application/base.usecase';
import { LikeFullProps } from '@/modules/like/domain/entities/like.type';

export class UnlikeCommand {
  userId: string;
  postId: string;
  constructor(payload: { userId: string; postId: string }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
  }
}

export class UnlikeResult implements LikeFullProps {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;
  constructor(payload: { id: string; userId: string; postId: string; createdAt: Date; updatedAt: Date }) {
    this.id = payload.id;
    this.userId = payload.userId;
    this.postId = payload.postId;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export abstract class UnlikeInPort implements UseCase<UnlikeCommand, UnlikeResult> {
  abstract execute(command: UnlikeCommand): Promise<UnlikeResult>;
}
