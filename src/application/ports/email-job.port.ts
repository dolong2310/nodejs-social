import { EEmailTemplate } from '@/domain/enums/mail.enum';

export interface IEmailJobData {
  toAddress: string;
  subject: string;
  body: { name: string; url: string; expiresIn: string; appName: string; supportUrl: string };
  template: EEmailTemplate;
}

export interface IEmailJobResult {
  sentAt: string;
}

export interface IEmailQueue {
  add(data: IEmailJobData): Promise<void>;
  close(): Promise<void>;
}
