import { UseCase } from '@/modules/core/application/base.usecase';

export class IncreaseViewsCommand {
  userId?: string;
  postId: string;
  constructor(payload: { userId?: string; postId: string }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
  }
}

export class IncreaseViewsResult {
  userViews: number;
  guestViews: number;
  updatedAt?: Date;
  constructor(payload: { userViews: number; guestViews: number; updatedAt?: Date }) {
    this.userViews = payload.userViews;
    this.guestViews = payload.guestViews;
    this.updatedAt = payload.updatedAt;
  }
}

export abstract class IncreaseViewsInPort implements UseCase<IncreaseViewsCommand, IncreaseViewsResult | null> {
  abstract execute(command: IncreaseViewsCommand): Promise<IncreaseViewsResult | null>;
}
