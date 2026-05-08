export interface OtpEmailJobData {
  toAddress: string;
  subject: string;
  body: { code: string; otpId: string };
}

export interface OtpEmailJobResult {
  sentAt: string;
}

export interface OtpEmailQueuePort {
  add(data: OtpEmailJobData): Promise<void>;
  close(): Promise<void>;
}
