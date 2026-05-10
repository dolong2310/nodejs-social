import { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteExpiredRefreshTokensCommand {
  now: Date;

  constructor(payload?: { now?: Date }) {
    this.now = payload?.now ?? new Date();
  }
}

export class DeleteExpiredRefreshTokensResult {
  deletedCount: number;

  constructor(payload: { deletedCount: number }) {
    this.deletedCount = payload.deletedCount;
  }
}

export abstract class DeleteExpiredRefreshTokensPort implements UseCase<
  DeleteExpiredRefreshTokensCommand,
  DeleteExpiredRefreshTokensResult
> {
  abstract execute(command?: DeleteExpiredRefreshTokensCommand): Promise<DeleteExpiredRefreshTokensResult>;
}
