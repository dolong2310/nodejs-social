import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { UseCase } from '@/modules/core/application/base.usecase';

export class UploadVideoStreamCommand {
  files: { filepath: string; filename: string; mimetype: string }[];
  constructor(files: { filepath: string; filename: string; mimetype: string }[]) {
    this.files = files;
  }
}

export class UploadVideoStreamResult {
  url: string;
  type: EnumMediaType;
  constructor(payload: { url: string; type: EnumMediaType }) {
    this.url = payload.url;
    this.type = payload.type;
  }
}

export abstract class UploadVideoStreamPort implements UseCase<UploadVideoStreamCommand, UploadVideoStreamResult[]> {
  abstract execute(command: UploadVideoStreamCommand): Promise<UploadVideoStreamResult[]>;
}
