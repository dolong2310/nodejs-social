import { CreateOtpProps, EnumOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class SendOtpCommand implements Pick<CreateOtpProps, 'email' | 'type'> {
  email: string;
  type: EnumOtpType;
  constructor(payload: CreateOtpProps) {
    this.email = payload.email;
    this.type = payload.type;
  }
}

export abstract class SendOtpPort implements UseCase<SendOtpCommand, void> {
  abstract execute(command: SendOtpCommand): Promise<void>;
}
