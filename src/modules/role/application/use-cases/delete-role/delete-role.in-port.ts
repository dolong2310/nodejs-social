import { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteRoleCommand {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class DeleteRoleInPort implements UseCase<DeleteRoleCommand, void> {
  abstract execute(command: DeleteRoleCommand): Promise<void>;
}
