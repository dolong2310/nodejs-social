import { UseCase } from '@/application/use-cases/base/base.usecase';

export class GetGoogleAuthUrlCommand {
  ip: string;
  userAgent: string;
  constructor(payload: { ip: string; userAgent: string }) {
    this.ip = payload.ip;
    this.userAgent = payload.userAgent;
  }
}

export abstract class GetGoogleAuthUrlInPort implements UseCase<GetGoogleAuthUrlCommand, string> {
  abstract execute(command: GetGoogleAuthUrlCommand): string;
}
