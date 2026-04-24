import { UseCase } from '@/application/use-cases/base/base.usecase';
import { CreateOtpProps, EOtpType } from '@/domain/entities/otp/otp.type';

export class SendOtpCommand implements Pick<CreateOtpProps, 'email' | 'type'> {
  email: string;
  type: EOtpType;
  constructor(payload: CreateOtpProps) {
    this.email = payload.email;
    this.type = payload.type;
  }
}

export abstract class SendOtpInPort implements UseCase<SendOtpCommand, void> {
  abstract execute(command: SendOtpCommand): Promise<void>;
}
