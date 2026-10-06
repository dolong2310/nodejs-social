import type { UseCase } from '@/modules/core/application/base.usecase';

export class IncreasePostsViewsInputPort {
  postIds: string[];
  isAuthenticatedUser: boolean;
  constructor(payload: { postIds: string[]; isAuthenticatedUser: boolean }) {
    this.postIds = payload.postIds;
    this.isAuthenticatedUser = payload.isAuthenticatedUser;
  }
}

export class IncreasePostsViewsOutputPort {
  updatedCount: number;
  constructor(payload: { updatedCount: number }) {
    this.updatedCount = payload.updatedCount;
  }
}

export abstract class IncreasePostsViewsPort implements UseCase<
  IncreasePostsViewsInputPort,
  IncreasePostsViewsOutputPort
> {
  abstract execute(input: IncreasePostsViewsInputPort): Promise<IncreasePostsViewsOutputPort>;
}
