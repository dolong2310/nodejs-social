import {
  type SendOtpEmailInputPort,
  SendOtpEmailPort,
  SendOtpEmailOutputPort
} from '@/modules/authentication/application/use-cases/send-otp-email/send-otp-email.port';
import type { EmailSenderPort } from '@/modules/core/application/ports/email-sender.port';

export class SendOtpEmailUseCase extends SendOtpEmailPort {
  constructor(private readonly emailSender: EmailSenderPort) {
    super();
  }

  async execute(input: SendOtpEmailInputPort): Promise<SendOtpEmailOutputPort> {
    await this.emailSender.sendEmail({
      toAddresses: input.toAddress,
      subject: input.subject,
      template: {
        name: 'otp',
        variables: {
          sender: 'Social App',
          subject: input.subject,
          code: input.code
        }
      }
    });
    return new SendOtpEmailOutputPort({ sentAt: new Date().toISOString() });
  }
}
