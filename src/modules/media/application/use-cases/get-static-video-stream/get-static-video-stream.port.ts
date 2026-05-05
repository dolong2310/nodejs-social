import { UseCase } from '@/modules/core/application/base.usecase';

export class GetStaticVideoStreamQuery {
  filename: string;
  rangeHeader?: string;
  constructor(payload: { filename: string; rangeHeader?: string }) {
    this.filename = payload.filename;
    this.rangeHeader = payload.rangeHeader;
  }
}

export class GetStaticVideoStreamResult {
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

export abstract class GetStaticVideoStreamPort implements UseCase<
  GetStaticVideoStreamQuery,
  GetStaticVideoStreamResult
> {
  abstract execute(query: GetStaticVideoStreamQuery): Promise<GetStaticVideoStreamResult>;
}
