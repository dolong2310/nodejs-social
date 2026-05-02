import { envConfig } from '@/bootstrap/config/env.config';
import { IEmailJobData } from '@/modules/core/application/ports/email-job.port';
import { FileStoragePort } from '@/modules/core/application/ports/file-storage.port';
import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { SendEmailCommand, SendEmailCommandOutput, SESClient } from '@aws-sdk/client-ses';
import path from 'path';

export interface IEmailService {
  sendEmail(payload: IEmailJobData): Promise<SendEmailCommandOutput>;
}

export class EmailService {
  private sesClient: SESClient;
  private readonly log: LoggerPort;

  constructor(
    private readonly logger: LoggerPort,
    private readonly fileStorage: FileStoragePort
  ) {
    this.log = this.logger.child({ module: 'email' });
    // Create SES service object.
    this.sesClient = new SESClient({
      region: envConfig.AWS_REGION,
      credentials: {
        secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
        accessKeyId: envConfig.AWS_ACCESS_KEY_ID
      }
    });
  }

  private createSendEmailCommand({
    fromAddress,
    toAddresses,
    ccAddresses = [],
    body,
    subject,
    replyToAddresses = []
  }: {
    fromAddress: string;
    toAddresses: string | string[];
    ccAddresses?: string | string[];
    body: string;
    subject: string;
    replyToAddresses?: string[];
  }) {
    return new SendEmailCommand({
      Destination: {
        /* required */
        ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses],
        CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses]
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Html: {
            Charset: 'UTF-8',
            Data: body
          }
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject
        }
      },
      Source: fromAddress,
      ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
    });
  }

  private async getTemplate(): Promise<string> {
    const contentBuffer = await this.fileStorage.readFile(path.resolve('src/views/otp.html'));
    return contentBuffer.toString('utf8');
  }

  async sendEmail({
    toAddress,
    subject,
    body
  }: {
    toAddress: string;
    subject: string;
    body: { code: string };
  }): Promise<SendEmailCommandOutput> {
    const sender = 'Social App';
    // TIPS: khi gửi email mà không muốn tạo email mới thì chỉ cần thêm +1 vào cuối của email đó (ví dụ: test123@gmail.com -> test123+1@gmail.com)
    const sendEmailCommand = this.createSendEmailCommand({
      fromAddress: envConfig.SES_FROM_ADDRESS,
      toAddresses: toAddress,
      subject,
      body: (await this.getTemplate())
        .replaceAll('{{sender}}', sender)
        .replaceAll('{{subject}}', subject)
        .replaceAll('{{code}}', body.code)
    });

    try {
      const sendEmailCommandOutput = await this.sesClient.send(sendEmailCommand);
      return sendEmailCommandOutput;
    } catch (error) {
      this.log.error({ err: error }, 'failed to send email');
      throw error;
    }
  }
}
