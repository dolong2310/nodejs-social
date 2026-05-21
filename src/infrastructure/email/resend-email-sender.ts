import {
  EmailSenderPort,
  EmailTemplatePayload,
  SendEmailPayload
} from '@/modules/core/application/ports/email-sender.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

type ResendEmailConfig = {
  apiKey: string;
  fromAddress: string;
};

export class ResendEmailSender implements EmailSenderPort {
  private readonly resend: Resend;
  private readonly log: LoggerPort;

  constructor(
    private readonly logger: LoggerPort,
    private readonly config: ResendEmailConfig
  ) {
    this.log = this.logger.child({ module: 'resend-email-sender' });
    this.resend = new Resend(config.apiKey);
  }

  async sendEmail(payload: SendEmailPayload): Promise<void> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.config.fromAddress,
        to: payload.toAddresses,
        cc: payload.ccAddresses,
        replyTo: payload.replyToAddresses,
        subject: payload.subject,
        html: await this.renderTemplate(payload.template)
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      this.log.error({ err: error, toAddresses: payload.toAddresses }, 'email:::failed-to-send-email');
      throw error;
    }
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
