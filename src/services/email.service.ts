import { envConfig } from '@/config';
import { EEmailTemplate, IEmailPayload } from '@/types/mail.type';
import { SendEmailCommand, SendEmailCommandOutput, SESClient } from '@aws-sdk/client-ses';
import fs from 'fs';
import path from 'path';

export interface IEmailService {
  sendEmail(payload: IEmailPayload): Promise<SendEmailCommandOutput>;
}

class EmailService {
  private sesClient: SESClient;

  constructor() {
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

  private getTemplate(template: EEmailTemplate) {
    switch (template) {
      case EEmailTemplate.VERIFY_EMAIL:
        return fs.readFileSync(path.resolve('src/templates/verify-email.html'), 'utf8');
      case EEmailTemplate.FORGOT_PASSWORD:
        return fs.readFileSync(path.resolve('src/templates/forgot-password-email.html'), 'utf8');
      default:
        throw new Error('Invalid template');
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
      body: this.getTemplate(template)
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
      console.error('Failed to send email: ', error);
      throw error;
    }
  }
}

export default EmailService;
