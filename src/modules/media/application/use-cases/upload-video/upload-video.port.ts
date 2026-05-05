import { UploadedFilePort } from '@/modules/media/application/ports/file-upload.port';
import { UseCase } from '@/modules/core/application/base.usecase';
import { EMediaType } from '@/modules/common/domain/enums/media.enum';

export class UploadVideoCommand {
  files: UploadedFilePort[];
  constructor(payload: { files: UploadedFilePort[] }) {
    this.files = payload.files;
  }
}

export class UploadVideoResult {
  url: string;
  type: EMediaType;
  constructor(payload: { url: string; type: EMediaType }) {
    this.url = payload.url;
    this.type = payload.type;
  }
}

export abstract class UploadVideoPort implements UseCase<UploadVideoCommand, UploadVideoResult[]> {
  abstract execute(command: UploadVideoCommand): Promise<UploadVideoResult[]>;
}
