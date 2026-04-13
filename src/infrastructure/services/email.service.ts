import { EEmailTemplate } from '@/domain/enums/mail.enum';

import { InvalidEmailTemplateException } from '@/application/errors/email.error';
import { IEmailJobData } from '@/application/ports/email-job.port';
import { IFileStorage } from '@/application/ports/file-storage.port';
import { ILogger } from '@/application/ports/logger.port';
import { IPathService } from '@/application/ports/path.port';

import { envConfig } from '@/bootstrap/config/env.config';

import { SendEmailCommand, SendEmailCommandOutput, SESClient } from '@aws-sdk/client-ses';

export interface IEmailService {
  sendEmail(payload: IEmailJobData): Promise<SendEmailCommandOutput>;
}

export class EmailService {
  private sesClient: SESClient;
  private readonly log: ILogger;

  constructor(
    private readonly logger: ILogger,
    private readonly fileStorage: IFileStorage,
    private readonly pathService: IPathService
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

  private async getTemplate(template: EEmailTemplate): Promise<string> {
    switch (template) {
      case EEmailTemplate.VERIFY_EMAIL: {
        const contentBuffer = await this.fileStorage.readFile(this.pathService.resolve('src/views/verify-email.html'));
        return contentBuffer.toString('utf8');
      }
      case EEmailTemplate.FORGOT_PASSWORD: {
        const contentBuffer = await this.fileStorage.readFile(
          this.pathService.resolve('src/views/forgot-password-email.html')
        );
        return contentBuffer.toString('utf8');
      }
      default:
        throw InvalidEmailTemplateException;
    }
  }

  async sendEmail({
    toAddress,
    subject,
    body,
    template
  }: {
    toAddress: string;
    subject: string;
    body: { name: string; url: string; expiresIn: string; appName: string; supportUrl: string };
    template: EEmailTemplate;
  }): Promise<SendEmailCommandOutput> {
    const sendEmailCommand = this.createSendEmailCommand({
      fromAddress: envConfig.SES_FROM_ADDRESS,
      toAddresses: toAddress,
      subject,
      body: (await this.getTemplate(template))
        .replaceAll('{{name}}', body.name)
        .replaceAll('{{url}}', body.url)
        .replaceAll('{{expiresIn}}', body.expiresIn)
        .replaceAll('{{appName}}', body.appName)
        .replaceAll('{{supportUrl}}', body.supportUrl)
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
