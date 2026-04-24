export interface IEmailJobData {
  toAddress: string;
  subject: string;
  body: { code: string; otpId: string };
}

export interface IEmailJobResult {
  sentAt: string;
}

export interface IEmailQueue {
  add(data: IEmailJobData): Promise<void>;
  close(): Promise<void>;
}
