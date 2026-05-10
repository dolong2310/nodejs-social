import { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteExpiredOtpsCommand {
  now: Date;

  constructor(now?: Date) {
    this.now = now ?? new Date();
  }
}

export class DeleteExpiredOtpsResult {
  deletedCount: number;

  constructor(payload: { deletedCount: number }) {
    this.deletedCount = payload.deletedCount;
  }
}

export abstract class DeleteExpiredOtpsPort implements UseCase<DeleteExpiredOtpsCommand, DeleteExpiredOtpsResult> {
  abstract execute(command?: DeleteExpiredOtpsCommand): Promise<DeleteExpiredOtpsResult>;
}
