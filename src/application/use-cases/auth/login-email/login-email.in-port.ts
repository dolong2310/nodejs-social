import { UseCase } from '@/application/use-cases/base/base.usecase';

export class LoginEmailCommand {
  email: string;
  password: string;
  totpCode?: string;
  emailOtpCode?: string;
  constructor(payload: { email: string; password: string; totpCode?: string; emailOtpCode?: string }) {
    // nếu cả 2 trường đều có hoặc không có thì sẽ chạy vào if này
    if ((payload.totpCode !== undefined) === (payload.emailOtpCode !== undefined)) {
      throw new Error('Only one of the fields is allowed, not both'); // TODO: validate ở middleware presentation layer => OnlyOneOfFieldsRequired
    }
    this.email = payload.email.toLowerCase().trim();
    this.password = payload.password;
    this.totpCode = payload.totpCode;
    this.emailOtpCode = payload.emailOtpCode;
  }
}

export class LoginEmailResult {
  accessToken: string;
  refreshToken: string;
  constructor(payload: { accessToken: string; refreshToken: string }) {
    this.accessToken = payload.accessToken;
    this.refreshToken = payload.refreshToken;
  }
}

export abstract class LoginEmailInPort implements UseCase<LoginEmailCommand, LoginEmailResult> {
  abstract execute(command: LoginEmailCommand): Promise<LoginEmailResult>;
}
