export enum EEmailTemplate {
  VERIFY_EMAIL = 'verify-email',
  FORGOT_PASSWORD = 'forgot-password'
}

export interface IEmailPayload {
  toAddress: string;
  subject: string;
  body: { name: string; url: string; expiresIn: string; appName: string; supportUrl: string };
  template: EEmailTemplate;
}
