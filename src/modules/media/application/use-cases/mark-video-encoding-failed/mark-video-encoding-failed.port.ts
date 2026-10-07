import type { UseCase } from '@/modules/core/application/base.usecase';

export class MarkVideoEncodingFailedInputPort {
  idName: string;
  message: string;
  constructor(payload: { idName: string; message: string }) {
    this.idName = payload.idName;
    this.message = payload.message;
  }
}

export abstract class MarkVideoEncodingFailedPort implements UseCase<MarkVideoEncodingFailedInputPort, void> {
  abstract execute(input: MarkVideoEncodingFailedInputPort): Promise<void>;
}
