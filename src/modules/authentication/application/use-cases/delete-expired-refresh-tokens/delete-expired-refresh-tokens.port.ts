import type { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteExpiredRefreshTokensInputPort {
  now: Date;

  constructor(payload?: { now?: Date }) {
    this.now = payload?.now ?? new Date();
  }
}

export class DeleteExpiredRefreshTokensOutputPort {
  deletedCount: number;

  constructor(payload: { deletedCount: number }) {
    this.deletedCount = payload.deletedCount;
  }
}

export abstract class DeleteExpiredRefreshTokensPort implements UseCase<
  DeleteExpiredRefreshTokensInputPort,
  DeleteExpiredRefreshTokensOutputPort
> {
  abstract execute(input?: DeleteExpiredRefreshTokensInputPort): Promise<DeleteExpiredRefreshTokensOutputPort>;
}
