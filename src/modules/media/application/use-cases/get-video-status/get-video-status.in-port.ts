import { UseCase } from '@/modules/core/application/base.usecase';
import { EEncodingVideoStatus, VideoStatusFullProps } from '@/modules/media/domain/entities/video-status.type';

export class GetVideoStatusQuery {
  name: string;
  constructor(payload: { name: string }) {
    this.name = payload.name;
  }
}

export class GetVideoStatusResult implements VideoStatusFullProps {
  id: string;
  name: string;
  status: EEncodingVideoStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
  constructor(payload: {
    id: string;
    name: string;
    status: EEncodingVideoStatus;
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

export abstract class GetVideoStatusInPort implements UseCase<GetVideoStatusQuery, GetVideoStatusResult | null> {
  abstract execute(query: GetVideoStatusQuery): Promise<GetVideoStatusResult | null>;
}
