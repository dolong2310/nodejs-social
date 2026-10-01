import type { UseCase } from '@/modules/core/application/base.usecase';

export class LoginGoogleInputPort {
  state: string;
  code: string;
  constructor(payload: { state: string; code: string }) {
    this.state = payload.state;
    this.code = payload.code;
  }
}

export class LoginGoogleOutputPort {
  accessToken: string;
  refreshToken: string;
  constructor(payload: { accessToken: string; refreshToken: string }) {
    this.accessToken = payload.accessToken;
    this.refreshToken = payload.refreshToken;
  }
}

export abstract class LoginGooglePort implements UseCase<LoginGoogleInputPort, LoginGoogleOutputPort> {
  abstract execute(input: LoginGoogleInputPort): Promise<LoginGoogleOutputPort>;
}
