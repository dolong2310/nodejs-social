import { UploadedFilePort } from '@/modules/media/application/ports/file-upload.port';
import { UseCase } from '@/modules/core/application/base.usecase';
import { EMediaType } from '@/modules/common/domain/enums/media.enum';

export class UploadImageCommand {
  files: UploadedFilePort[];
  constructor(payload: { files: UploadedFilePort[] }) {
    this.files = payload.files;
  }
}

export class UploadImageResult {
  url: string;
  type: EMediaType;
  constructor(payload: { url: string; type: EMediaType }) {
    this.url = payload.url;
    this.type = payload.type;
  }
}

export abstract class UploadImagePort implements UseCase<UploadImageCommand, UploadImageResult[]> {
  abstract execute(command: UploadImageCommand): Promise<UploadImageResult[]>;
}
