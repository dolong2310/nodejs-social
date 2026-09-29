import { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteHashtagInputPort {
  id: string;
  actorId: string | null;
  constructor(payload: { id: string; actorId?: string | null }) {
    this.id = payload.id;
    this.actorId = payload.actorId ?? null;
  }
}

export abstract class DeleteHashtagPort implements UseCase<DeleteHashtagInputPort, void> {
  abstract execute(input: DeleteHashtagInputPort): Promise<void>;
}
