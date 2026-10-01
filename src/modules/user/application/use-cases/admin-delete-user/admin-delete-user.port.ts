import type { UseCase } from '@/modules/core/application/base.usecase';

export class AdminDeleteUserInputPort {
  actorId: string;
  userId: string;

  constructor(payload: { actorId: string; userId: string }) {
    this.actorId = payload.actorId;
    this.userId = payload.userId;
  }
}

export abstract class AdminDeleteUserPort implements UseCase<AdminDeleteUserInputPort, void> {
  abstract execute(input: AdminDeleteUserInputPort): Promise<void>;
}
