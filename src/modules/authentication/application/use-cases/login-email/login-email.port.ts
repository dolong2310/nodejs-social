import { UseCase } from '@/modules/core/application/base.usecase';

export class LoginEmailInputPort {
  email: string;
  password: string;
  totpCode?: string;
  emailOtpCode?: string;
  constructor(payload: { email: string; password: string; totpCode?: string; emailOtpCode?: string }) {
    // Enter this branch when both fields are present or both fields are absent.
    if ((payload.totpCode !== undefined) === (payload.emailOtpCode !== undefined)) {
      throw new Error('Only one of the fields is allowed, not both'); // TODO: validate in presentation middleware => OnlyOneOfFieldsRequired
    }
    this.email = payload.email.toLowerCase().trim();
    this.password = payload.password;
    this.totpCode = payload.totpCode;
    this.emailOtpCode = payload.emailOtpCode;
  }
}

export class LoginEmailOutputPort {
  accessToken: string;
  refreshToken: string;
  constructor(payload: { accessToken: string; refreshToken: string }) {
    this.accessToken = payload.accessToken;
    this.refreshToken = payload.refreshToken;
  }
}

export abstract class LoginEmailPort implements UseCase<LoginEmailInputPort, LoginEmailOutputPort> {
  abstract execute(input: LoginEmailInputPort): Promise<LoginEmailOutputPort>;
}
