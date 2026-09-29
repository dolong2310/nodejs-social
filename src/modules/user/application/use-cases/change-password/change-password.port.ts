import { UseCase } from '@/modules/core/application/base.usecase';

export class ChangePasswordInputPort {
  userId: string;
  password: string;
  constructor(input: { userId: string; password: string }) {
    this.userId = input.userId;
    this.password = input.password;
  }
}

export abstract class ChangePasswordPort implements UseCase<ChangePasswordInputPort, boolean> {
  abstract execute(input: ChangePasswordInputPort): Promise<boolean>;
}
