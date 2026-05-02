import { UseCase } from '@/modules/core/application/base.usecase';

export class DeletePermissionCommand {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class DeletePermissionInPort implements UseCase<DeletePermissionCommand, void> {
  abstract execute(command: DeletePermissionCommand): Promise<void>;
}
