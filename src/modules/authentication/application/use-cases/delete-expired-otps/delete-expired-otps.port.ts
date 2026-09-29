import { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteExpiredOtpsInputPort {
  now: Date;

  constructor(now?: Date) {
    this.now = now ?? new Date();
  }
}

export class DeleteExpiredOtpsOutputPort {
  deletedCount: number;

  constructor(payload: { deletedCount: number }) {
    this.deletedCount = payload.deletedCount;
  }
}

export abstract class DeleteExpiredOtpsPort implements UseCase<
  DeleteExpiredOtpsInputPort,
  DeleteExpiredOtpsOutputPort
> {
  abstract execute(input?: DeleteExpiredOtpsInputPort): Promise<DeleteExpiredOtpsOutputPort>;
}
