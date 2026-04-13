import { EEncodingVideoStatus, EMediaType } from '@/domain/enums/media.enum';

export class StaticVideoStreamResultDTO {
  videoPath: string;
  videoSize: number;
  start: number;
  end: number;
  contentLength: number;
  contentType: string;
  constructor(payload: {
    videoPath: string;
    videoSize: number;
    start: number;
    end: number;
    contentLength: number;
    contentType: string;
  }) {
    this.videoPath = payload.videoPath;
    this.videoSize = payload.videoSize;
    this.start = payload.start;
    this.end = payload.end;
    this.contentLength = payload.contentLength;
    this.contentType = payload.contentType;
  }
}

export class VideoStatusResultDTO {
  // TODO: implements IVideoStatus
  id: string;
  name: string;
  status: EEncodingVideoStatus;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
  constructor(payload: {
    id: string;
    name: string;
    status: EEncodingVideoStatus;
    message: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = payload.id;
    this.name = payload.name;
    this.status = payload.status;
    this.message = payload.message;
    this.createdAt = payload.createdAt;
    this.updatedAt = payload.updatedAt;
  }
}

export class UploadMediaResultDTO {
  url: string;
  type: EMediaType;
  constructor(payload: { url: string; type: EMediaType }) {
    this.url = payload.url;
    this.type = payload.type;
  }
}
