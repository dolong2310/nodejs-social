import { UseCase } from '@/modules/core/application/base.usecase';

export class GetGoogleAuthUrlCommand {
  ip: string;
  userAgent: string;
  constructor(payload: { ip: string; userAgent: string }) {
    this.ip = payload.ip;
    this.userAgent = payload.userAgent;
  }
}

export abstract class GetGoogleAuthUrlPort implements UseCase<GetGoogleAuthUrlCommand, string> {
  abstract execute(command: GetGoogleAuthUrlCommand): string;
}
