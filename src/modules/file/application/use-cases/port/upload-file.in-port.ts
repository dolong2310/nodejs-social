import { UseCase } from '@/modules/core/application-base/use-cases.port.base';
import type { FileEntity } from '@/modules/file/domain/entities/file.entity';

export interface UploadFileCommand {
  path: string;
  file: Buffer | File;
}

export abstract class UploadFileInPort implements UseCase<UploadFileCommand, FileEntity> {
  abstract execute(uploadFileCommand: UploadFileCommand): Promise<FileEntity>;
}
