import { UseCase } from '@/modules/core/application/base.usecase';

export class RefreshTokenInputPort {
  refreshToken: string;
  constructor(payload: { refreshToken: string }) {
    this.refreshToken = payload.refreshToken;
  }
}

export class RefreshTokenOutputPort {
  accessToken: string;
  refreshToken: string;
  constructor(payload: { accessToken: string; refreshToken: string }) {
    this.accessToken = payload.accessToken;
    this.refreshToken = payload.refreshToken;
  }
}

export abstract class RefreshTokenPort implements UseCase<RefreshTokenInputPort, RefreshTokenOutputPort> {
  abstract execute(input: RefreshTokenInputPort): Promise<RefreshTokenOutputPort>;
}
