import { UseCase } from '@/modules/core/application/base.usecase';
import { CreateOtpProps, EOtpType } from '@/modules/auth/domain/entities/otp.type';

export class SendOtpCommand implements Pick<CreateOtpProps, 'email' | 'type'> {
  email: string;
  type: EOtpType;
  constructor(payload: CreateOtpProps) {
    this.email = payload.email;
    this.type = payload.type;
  }
}

export abstract class SendOtpPort implements UseCase<SendOtpCommand, void> {
  abstract execute(command: SendOtpCommand): Promise<void>;
}
