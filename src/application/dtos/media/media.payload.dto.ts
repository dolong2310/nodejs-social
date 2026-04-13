import { IUploadedFile } from '@/application/ports/file-upload.port';

export class GetStaticVideoStreamPayloadDTO {
  filename: string;
  rangeHeader?: string;
  constructor(payload: { filename: string; rangeHeader?: string }) {
    this.filename = payload.filename;
    this.rangeHeader = payload.rangeHeader;
  }
}

export class GetVideoStatusByNamePayloadDTO {
  name: string;
  constructor(payload: { name: string }) {
    this.name = payload.name;
  }
}

export class UploadMediaPayloadDTO {
  files: IUploadedFile[];
  constructor(payload: { files: IUploadedFile[] }) {
    this.files = payload.files;
  }
}
