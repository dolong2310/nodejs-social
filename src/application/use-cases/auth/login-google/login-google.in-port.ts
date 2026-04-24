import { UseCase } from '@/application/use-cases/base/base.usecase';

export class LoginGoogleCommand {
  state: string;
  code: string;
  constructor(payload: { state: string; code: string }) {
    this.state = payload.state;
    this.code = payload.code;
  }
}

export class LoginGoogleResult {
  accessToken: string;
  refreshToken: string;
  constructor(payload: { accessToken: string; refreshToken: string }) {
    this.accessToken = payload.accessToken;
    this.refreshToken = payload.refreshToken;
  }
}

export abstract class LoginGoogleInPort implements UseCase<LoginGoogleCommand, LoginGoogleResult> {
  abstract execute(command: LoginGoogleCommand): Promise<LoginGoogleResult>;
}
