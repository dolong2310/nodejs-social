import { UseCase } from '@/modules/core/application/base.usecase';

export class ChangePasswordCommand {
  userId: string;
  password: string;
  constructor(command: { userId: string; password: string }) {
    this.userId = command.userId;
    this.password = command.password;
  }
}

export abstract class ChangePasswordPort implements UseCase<ChangePasswordCommand, boolean> {
  abstract execute(command: ChangePasswordCommand): Promise<boolean>;
}
