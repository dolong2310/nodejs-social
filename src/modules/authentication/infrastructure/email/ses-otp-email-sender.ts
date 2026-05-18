import { envConfig } from '@/bootstrap/config/env.config';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { SendEmailCommand, SendEmailCommandOutput, SESClient } from '@aws-sdk/client-ses';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export class SesOtpEmailSender {
  private readonly sesClient: SESClient;
  private readonly log: LoggerPort;

  constructor(private readonly logger: LoggerPort) {
    this.log = this.logger.child({ module: 'otp-email-sender' });
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
  }): SendEmailCommand {
    return new SendEmailCommand({
      Destination: {
        ToAddresses: Array.isArray(toAddresses) ? toAddresses : [toAddresses],
        CcAddresses: Array.isArray(ccAddresses) ? ccAddresses : [ccAddresses]
      },
      Message: {
        Body: {
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
      ReplyToAddresses: Array.isArray(replyToAddresses) ? replyToAddresses : [replyToAddresses]
    });
  }

  private async getTemplate(): Promise<string> {
    const otpHtmlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates', 'otp.html');
    return readFile(otpHtmlPath, 'utf8');
  }

  async sendOtpEmail({
    toAddress,
    subject,
    code
  }: {
    toAddress: string;
    subject: string;
    code: string;
  }): Promise<SendEmailCommandOutput> {
    const sender = 'Social App';
    const sendEmailCommand = this.createSendEmailCommand({
      fromAddress: envConfig.SES_FROM_ADDRESS,
      toAddresses: toAddress,
      subject,
      body: (await this.getTemplate())
        .replaceAll('{{sender}}', sender)
        .replaceAll('{{subject}}', subject)
        .replaceAll('{{code}}', code)
    });

    try {
      return await this.sesClient.send(sendEmailCommand);
    } catch (error) {
      this.log.error({ err: error, toAddress }, 'email:::failed-to-send-otp-email');
      throw error;
    }
  }
}
