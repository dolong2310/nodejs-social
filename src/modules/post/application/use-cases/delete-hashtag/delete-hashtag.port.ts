import { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteHashtagCommand {
  id: string;
  actorId: string | null;
  constructor(payload: { id: string; actorId?: string | null }) {
    this.id = payload.id;
    this.actorId = payload.actorId ?? null;
  }
}

export abstract class DeleteHashtagPort implements UseCase<DeleteHashtagCommand, void> {
  abstract execute(command: DeleteHashtagCommand): Promise<void>;
}
