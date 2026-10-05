import type { UseCase } from '@/modules/core/application/base.usecase';
import type { LikeFullProps } from '@/modules/post/domain/entities/like.types';

export class CreateLikeInputPort {
  userId: string;
  postId: string;
  constructor(payload: { userId: string; postId: string }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
  }
}

export class CreateLikeOutputPort implements LikeFullProps {
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

export abstract class CreateLikePort implements UseCase<CreateLikeInputPort, CreateLikeOutputPort> {
  abstract execute(input: CreateLikeInputPort): Promise<CreateLikeOutputPort>;
}
