import { UseCase } from '@/application/use-cases/base/base.usecase';
import { LikeFullProps } from '@/domain/entities/like/like.type';

export class CreateLikeCommand {
  userId: string;
  postId: string;
  constructor(payload: { userId: string; postId: string }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
  }
}

export class CreateLikeResult implements LikeFullProps {
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

export abstract class CreateLikeInPort implements UseCase<CreateLikeCommand, CreateLikeResult> {
  abstract execute(command: CreateLikeCommand): Promise<CreateLikeResult>;
}
