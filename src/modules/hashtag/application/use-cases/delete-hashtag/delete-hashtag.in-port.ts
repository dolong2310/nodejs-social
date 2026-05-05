import { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteHashtagCommand {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class DeleteHashtagInPort implements UseCase<DeleteHashtagCommand, void> {
  abstract execute(command: DeleteHashtagCommand): Promise<void>;
}
