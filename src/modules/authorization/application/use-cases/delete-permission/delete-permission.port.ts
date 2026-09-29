import { UseCase } from '@/modules/core/application/base.usecase';

export class DeletePermissionInputPort {
  id: string;
  actorId: string | null;
  constructor(payload: { id: string; actorId?: string | null }) {
    this.id = payload.id;
    this.actorId = payload.actorId ?? null;
  }
}

export abstract class DeletePermissionPort implements UseCase<DeletePermissionInputPort, void> {
  abstract execute(input: DeletePermissionInputPort): Promise<void>;
}
