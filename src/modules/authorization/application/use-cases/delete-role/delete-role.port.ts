import { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteRoleCommand {
  id: string;
  actorId: string | null;
  constructor(payload: { id: string; actorId?: string | null }) {
    this.id = payload.id;
    this.actorId = payload.actorId ?? null;
  }
}

export abstract class DeleteRolePort implements UseCase<DeleteRoleCommand, void> {
  abstract execute(command: DeleteRoleCommand): Promise<void>;
}
