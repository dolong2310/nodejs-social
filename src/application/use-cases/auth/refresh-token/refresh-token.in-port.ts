import { UseCase } from '@/application/use-cases/base/base.usecase';

export class RefreshTokenCommand {
  refreshToken: string;
  constructor(payload: { refreshToken: string }) {
    this.refreshToken = payload.refreshToken;
  }
}

export class RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  constructor(payload: { accessToken: string; refreshToken: string }) {
    this.accessToken = payload.accessToken;
    this.refreshToken = payload.refreshToken;
  }
}

export abstract class RefreshTokenInPort implements UseCase<RefreshTokenCommand, RefreshTokenResult> {
  abstract execute(command: RefreshTokenCommand): Promise<RefreshTokenResult>;
}
