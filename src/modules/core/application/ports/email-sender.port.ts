export type EmailTemplateVariables = Record<string, string | number | boolean | null | undefined>;

export type EmailTemplatePayload = {
  name: string;
  variables?: EmailTemplateVariables;
};

export type SendEmailPayload = {
  toAddresses: string | string[];
  ccAddresses?: string | string[];
  replyToAddresses?: string[];
  subject: string;
  template: EmailTemplatePayload;
};

export interface EmailSenderPort {
  sendEmail(payload: SendEmailPayload): Promise<void>;
}
