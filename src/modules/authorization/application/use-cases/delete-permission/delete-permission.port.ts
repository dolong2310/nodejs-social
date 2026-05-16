import { UseCase } from '@/modules/core/application/base.usecase';

export class DeletePermissionCommand {
  id: string;
  actorId: string | null;
  constructor(payload: { id: string; actorId?: string | null }) {
    this.id = payload.id;
    this.actorId = payload.actorId ?? null;
  }
}

export abstract class DeletePermissionPort implements UseCase<DeletePermissionCommand, void> {
  abstract execute(command: DeletePermissionCommand): Promise<void>;
}
