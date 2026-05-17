import { UseCase } from '@/modules/core/application/base.usecase';

export class AdminDeleteUserCommand {
  actorId: string;
  userId: string;

  constructor(payload: { actorId: string; userId: string }) {
    this.actorId = payload.actorId;
    this.userId = payload.userId;
  }
}

export abstract class AdminDeleteUserPort implements UseCase<AdminDeleteUserCommand, void> {
  abstract execute(command: AdminDeleteUserCommand): Promise<void>;
}
