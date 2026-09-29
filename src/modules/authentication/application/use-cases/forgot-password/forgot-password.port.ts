import { UseCase } from '@/modules/core/application/base.usecase';

export class ForgotPasswordInputPort {
  email: string;
  code: string;
  password: string;
  constructor(payload: { email: string; code: string; password: string }) {
    this.email = payload.email.toLowerCase().trim();
    this.code = payload.code;
    this.password = payload.password;
  }
}

export abstract class ForgotPasswordPort implements UseCase<ForgotPasswordInputPort, boolean> {
  abstract execute(input: ForgotPasswordInputPort): Promise<boolean>;
}
