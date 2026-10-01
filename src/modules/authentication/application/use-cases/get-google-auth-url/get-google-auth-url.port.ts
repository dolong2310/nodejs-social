import type { UseCase } from '@/modules/core/application/base.usecase';

export class GetGoogleAuthUrlInputPort {
  ip: string;
  userAgent: string;
  constructor(payload: { ip: string; userAgent: string }) {
    this.ip = payload.ip;
    this.userAgent = payload.userAgent;
  }
}

export abstract class GetGoogleAuthUrlPort implements UseCase<GetGoogleAuthUrlInputPort, string> {
  abstract execute(input: GetGoogleAuthUrlInputPort): string;
}
