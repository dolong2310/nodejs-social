import { UseCase } from '@/modules/core/application/base.usecase';

export class Setup2FACommand {
  userId: string;
  constructor(payload: { userId: string }) {
    this.userId = payload.userId;
  }
}

export class Setup2FAResult {
  secret: string;
  uri: string;
  constructor(payload: { secret: string; uri: string }) {
    this.secret = payload.secret;
    this.uri = payload.uri;
  }
}

export abstract class Setup2FAPort implements UseCase<Setup2FACommand, Setup2FAResult> {
  abstract execute(command: Setup2FACommand): Promise<Setup2FAResult>;
}
