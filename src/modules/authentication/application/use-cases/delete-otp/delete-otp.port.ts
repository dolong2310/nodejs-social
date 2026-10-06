import type { UseCase } from '@/modules/core/application/base.usecase';

export class DeleteOtpInputPort {
  otpId: string;
  constructor(payload: { otpId: string }) {
    this.otpId = payload.otpId;
  }
}

export abstract class DeleteOtpPort implements UseCase<DeleteOtpInputPort, void> {
  abstract execute(input: DeleteOtpInputPort): Promise<void>;
}
