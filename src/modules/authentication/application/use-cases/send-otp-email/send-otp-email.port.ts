import type { UseCase } from '@/modules/core/application/base.usecase';

export class SendOtpEmailInputPort {
  toAddress: string;
  subject: string;
  code: string;
  constructor(payload: { toAddress: string; subject: string; code: string }) {
    this.toAddress = payload.toAddress;
    this.subject = payload.subject;
    this.code = payload.code;
  }
}

export class SendOtpEmailOutputPort {
  sentAt: string;
  constructor(payload: { sentAt: string }) {
    this.sentAt = payload.sentAt;
  }
}

export abstract class SendOtpEmailPort implements UseCase<SendOtpEmailInputPort, SendOtpEmailOutputPort> {
  abstract execute(input: SendOtpEmailInputPort): Promise<SendOtpEmailOutputPort>;
}
