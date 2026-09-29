import { UseCase } from '@/modules/core/application/base.usecase';

export class LogoutInputPort {
  refreshToken: string;
  constructor(payload: { refreshToken: string }) {
    this.refreshToken = payload.refreshToken;
  }
}

export abstract class LogoutPort implements UseCase<LogoutInputPort, boolean> {
  abstract execute(input: LogoutInputPort): Promise<boolean>;
}
