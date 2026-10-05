import type { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import type { UseCase } from '@/modules/core/application/base.usecase';

export class UploadImageInputPort {
  files: { filepath: string; filename: string; mimetype: string }[];
  constructor(files: { filepath: string; filename: string; mimetype: string }[]) {
    this.files = files;
  }
}

export class UploadImageOutputPort {
  url: string;
  type: EnumMediaType;
  constructor(payload: { url: string; type: EnumMediaType }) {
    this.url = payload.url;
    this.type = payload.type;
  }
}

export abstract class UploadImagePort implements UseCase<UploadImageInputPort, UploadImageOutputPort[]> {
  abstract execute(input: UploadImageInputPort): Promise<UploadImageOutputPort[]>;
}
