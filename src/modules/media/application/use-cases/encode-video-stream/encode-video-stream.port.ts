import type { UseCase } from '@/modules/core/application/base.usecase';

export class EncodeVideoStreamInputPort {
  filepath: string;
  idName: string;
  constructor(payload: { filepath: string; idName: string }) {
    this.filepath = payload.filepath;
    this.idName = payload.idName;
  }
}

export class EncodeVideoStreamOutputPort {
  idName: string;
  constructor(payload: { idName: string }) {
    this.idName = payload.idName;
  }
}

export abstract class EncodeVideoStreamPort implements UseCase<
  EncodeVideoStreamInputPort,
  EncodeVideoStreamOutputPort
> {
  abstract execute(input: EncodeVideoStreamInputPort): Promise<EncodeVideoStreamOutputPort>;
}
