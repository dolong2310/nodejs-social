import type { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteRoleInputPort {
  id: string;
  actorId: string | null;
  constructor(payload: { id: string; actorId?: string | null }) {
    this.id = payload.id;
    this.actorId = payload.actorId ?? null;
  }
}

export abstract class DeleteRolePort implements UseCase<DeleteRoleInputPort, void> {
  abstract execute(input: DeleteRoleInputPort): Promise<void>;
}
