import { IUploadedFile } from '@/application/ports/file-upload.port';
import { UseCase } from '@/application/use-cases/base/base.usecase';
import { EMediaType } from '@/domain/enums/media.enum';

export class UploadVideoCommand {
  files: IUploadedFile[];
  constructor(payload: { files: IUploadedFile[] }) {
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

export abstract class UploadVideoInPort implements UseCase<UploadVideoCommand, UploadVideoResult[]> {
  abstract execute(command: UploadVideoCommand): Promise<UploadVideoResult[]>;
}
