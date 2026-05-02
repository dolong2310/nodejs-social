import { UploadedFilePort } from '@/modules/core/application/ports/file-upload.port';
import { UseCase } from '@/modules/core/application/base.usecase';
import { EMediaType } from '@/modules/core/domain/enums/media.enum';

export class UploadVideoStreamCommand {
  files: UploadedFilePort[];
  constructor(payload: { files: UploadedFilePort[] }) {
    this.files = payload.files;
  }
}

export class UploadVideoStreamResult {
  url: string;
  type: EMediaType;
  constructor(payload: { url: string; type: EMediaType }) {
    this.url = payload.url;
    this.type = payload.type;
  }
}

export abstract class UploadVideoStreamInPort implements UseCase<UploadVideoStreamCommand, UploadVideoStreamResult[]> {
  abstract execute(command: UploadVideoStreamCommand): Promise<UploadVideoStreamResult[]>;
}
