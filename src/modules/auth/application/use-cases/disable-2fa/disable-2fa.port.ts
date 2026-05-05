import { UseCase } from '@/modules/core/application/base.usecase';

export class Disable2FACommand {
  userId: string;
  totpCode?: string;
  emailOtpCode?: string;
  constructor(payload: { userId: string; totpCode?: string; emailOtpCode?: string }) {
    // nếu cả 2 trường đều có hoặc không có thì sẽ chạy vào if này
    if ((payload.totpCode !== undefined) === (payload.emailOtpCode !== undefined)) {
      throw new Error('Only one of the fields is allowed, not both'); // TODO: validate ở middleware presentation layer => OnlyOneOfFieldsRequired
    }
    this.userId = payload.userId;
    this.totpCode = payload.totpCode;
    this.emailOtpCode = payload.emailOtpCode;
  }
}

export abstract class Disable2FAPort implements UseCase<Disable2FACommand, boolean> {
  abstract execute(command: Disable2FACommand): Promise<boolean>;
}
