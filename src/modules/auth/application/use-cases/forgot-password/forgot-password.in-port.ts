import { UseCase } from '@/modules/core/application/base.usecase';

export class ForgotPasswordCommand {
  email: string;
  code: string;
  password: string;
  constructor(payload: { email: string; code: string; password: string }) {
    this.email = payload.email.toLowerCase().trim();
    this.code = payload.code;
    this.password = payload.password;
  }
}

export abstract class ForgotPasswordInPort implements UseCase<ForgotPasswordCommand, boolean> {
  abstract execute(command: ForgotPasswordCommand): Promise<boolean>;
}
