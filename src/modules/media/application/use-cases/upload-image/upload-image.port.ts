import { EMediaType } from '@/modules/common/domain/enums/media.enum';
import { UseCase } from '@/modules/core/application/base.usecase';

export class UploadImageCommand {
  files: { filepath: string; filename: string; mimetype: string }[];
  constructor(files: { filepath: string; filename: string; mimetype: string }[]) {
    this.files = files;
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
