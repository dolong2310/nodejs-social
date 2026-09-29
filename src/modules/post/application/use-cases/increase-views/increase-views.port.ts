import { UseCase } from '@/modules/core/application/base.usecase';

export class IncreaseViewsInputPort {
  userId?: string;
  postId: string;
  constructor(payload: { userId?: string; postId: string }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
  }
}

export class IncreaseViewsOutputPort {
  userViews: number;
  guestViews: number;
  updatedAt?: Date;
  constructor(payload: { userViews: number; guestViews: number; updatedAt?: Date }) {
    this.userViews = payload.userViews;
    this.guestViews = payload.guestViews;
    this.updatedAt = payload.updatedAt;
  }
}

export abstract class IncreaseViewsPort implements UseCase<IncreaseViewsInputPort, IncreaseViewsOutputPort | null> {
  abstract execute(input: IncreaseViewsInputPort): Promise<IncreaseViewsOutputPort | null>;
}
