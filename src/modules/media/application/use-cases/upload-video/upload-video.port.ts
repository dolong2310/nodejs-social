import { EnumMediaType } from '@/modules/common/domain/enums/media.enum';
import { UseCase } from '@/modules/core/application/base.usecase';

export class UploadVideoInputPort {
  files: { filepath: string; filename: string; mimetype: string }[];
  constructor(files: { filepath: string; filename: string; mimetype: string }[]) {
    this.files = files;
  }
}

export class UploadVideoOutputPort {
  url: string;
  type: EnumMediaType;
  constructor(payload: { url: string; type: EnumMediaType }) {
    this.url = payload.url;
    this.type = payload.type;
  }
}

export abstract class UploadVideoPort implements UseCase<UploadVideoInputPort, UploadVideoOutputPort[]> {
  abstract execute(input: UploadVideoInputPort): Promise<UploadVideoOutputPort[]>;
}
