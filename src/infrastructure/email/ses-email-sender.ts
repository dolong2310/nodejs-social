import type {
  EmailSenderPort,
  EmailTemplatePayload,
  SendEmailPayload
} from '@/modules/core/application/ports/email-sender.port';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type SesEmailConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  fromAddress: string;
};

export class SesEmailSender implements EmailSenderPort {
  private readonly sesClient: SESClient;
  private readonly log: LoggerPort;

  constructor(
    private readonly logger: LoggerPort,
    private readonly config: SesEmailConfig
  ) {
    this.log = this.logger.child({ module: 'ses-email-sender' });
    this.sesClient = new SESClient({
      region: config.region,
      credentials: {
        secretAccessKey: config.secretAccessKey,
        accessKeyId: config.accessKeyId
      }
    });
  }

  async sendEmail(payload: SendEmailPayload): Promise<void> {
    const sendEmailCommand = this.createSendEmailCommand({
      fromAddress: this.config.fromAddress,
      toAddresses: payload.toAddresses,
      ccAddresses: payload.ccAddresses,
      body: await this.renderTemplate(payload.template),
      subject: payload.subject,
      replyToAddresses: payload.replyToAddresses
    });

    try {
      await this.sesClient.send(sendEmailCommand);
    } catch (error) {
      this.log.error({ err: error, toAddresses: payload.toAddresses }, 'email:::failed-to-send-email');
      throw error;
    }
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

  private async renderTemplate(template: EmailTemplatePayload): Promise<string> {
    const templateHtml = await readFile(this.resolveTemplatePath(template.name), 'utf8');

    return Object.entries(template.variables ?? {}).reduce((body, [key, value]) => {
      return body.replaceAll(`{{${key}}}`, String(value ?? ''));
    }, templateHtml);
  }

  private resolveTemplatePath(templateName: string): string {
    return path.join(path.dirname(fileURLToPath(import.meta.url)), 'templates', `${templateName}.html`);
  }
}
