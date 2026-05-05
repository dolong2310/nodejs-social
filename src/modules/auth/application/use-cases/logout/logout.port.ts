import { UseCase } from '@/modules/core/application/base.usecase';

export class LogoutCommand {
  refreshToken: string;
  constructor(payload: { refreshToken: string }) {
    this.refreshToken = payload.refreshToken;
  }
}

export abstract class LogoutPort implements UseCase<LogoutCommand, boolean> {
  abstract execute(command: LogoutCommand): Promise<boolean>;
}
