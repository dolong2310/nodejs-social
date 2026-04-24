import { UseCase } from '@/application/use-cases/base/base.usecase';

export class LogoutCommand {
  refreshToken: string;
  constructor(payload: { refreshToken: string }) {
    this.refreshToken = payload.refreshToken;
  }
}

export abstract class LogoutInPort implements UseCase<LogoutCommand, boolean> {
  abstract execute(command: LogoutCommand): Promise<boolean>;
}
