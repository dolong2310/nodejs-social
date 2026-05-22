import { UseCase } from '@/modules/core/application/base.usecase';

export class Disable2FACommand {
  userId: string;
  totpCode?: string;
  emailOtpCode?: string;
  constructor(payload: { userId: string; totpCode?: string; emailOtpCode?: string }) {
    // TODO: enter this branch when both fields are present or both fields are absent.
    if ((payload.totpCode !== undefined) === (payload.emailOtpCode !== undefined)) {
      throw new Error('Only one of the fields is allowed, not both'); // TODO: validate in presentation middleware => OnlyOneOfFieldsRequired
    }
    this.userId = payload.userId;
    this.totpCode = payload.totpCode;
    this.emailOtpCode = payload.emailOtpCode;
  }
}

export abstract class Disable2FAPort implements UseCase<Disable2FACommand, boolean> {
  abstract execute(command: Disable2FACommand): Promise<boolean>;
}
