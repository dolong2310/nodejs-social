import type { UseCase } from '@/modules/core/application/base.usecase';

export class Setup2FAInputPort {
  userId: string;
  constructor(payload: { userId: string }) {
    this.userId = payload.userId;
  }
}

export class Setup2FAOutputPort {
  secret: string;
  uri: string;
  constructor(payload: { secret: string; uri: string }) {
    this.secret = payload.secret;
    this.uri = payload.uri;
  }
}

export abstract class Setup2FAPort implements UseCase<Setup2FAInputPort, Setup2FAOutputPort> {
  abstract execute(input: Setup2FAInputPort): Promise<Setup2FAOutputPort>;
}
