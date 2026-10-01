import { UseCase } from '@/modules/core/application/base.usecase';
import { EnumEncodingVideoStatus, VideoStatusFullProps } from '@/modules/media/domain/entities/video-status.types';

export class GetVideoStatusInputPort {
  name: string;
  constructor(payload: { name: string }) {
    this.name = payload.name;
  }
}

export class GetVideoStatusOutputPort implements VideoStatusFullProps {
  id: string;
  name: string;
  status: EnumEncodingVideoStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  constructor(payload: {
    id: string;
    name: string;
    status: EnumEncodingVideoStatus;
    message?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = payload.id;
    this.name = payload.name;
    this.status = payload.status;
    this.message = payload.message;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export abstract class GetVideoStatusPort implements UseCase<GetVideoStatusInputPort, GetVideoStatusOutputPort | null> {
  abstract execute(input: GetVideoStatusInputPort): Promise<GetVideoStatusOutputPort | null>;
}
