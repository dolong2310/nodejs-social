import { IFileUploadService, IUploadedFile } from '@/application/ports/file-upload.port';
import { Request } from 'express';
import formidable, { File } from 'formidable';

export class FormidableFileUploadService implements IFileUploadService {
  constructor(private readonly req: Request) {}

  private map(file: File): IUploadedFile {
    return {
      filepath: file.filepath,
      filename: file.newFilename,
      mimetype: file.mimetype ?? 'application/octet-stream'
    };
  }

  async uploadImages(): Promise<IUploadedFile[]> {
    const form = formidable({ multiples: true });

    return new Promise((resolve, reject) => {
      form.parse(this.req, (err, _, files) => {
        if (err) return reject(err);
        const list = files.image as File[];
        resolve(list.map(this.map));
      });
    });
  }

  async uploadVideos(): Promise<IUploadedFile[]> {
    const form = formidable({ multiples: true });

    return new Promise((resolve, reject) => {
      form.parse(this.req, (err, _, files) => {
        if (err) return reject(err);
        const list = files.video as File[];
        resolve(list.map(this.map));
      });
    });
  }

  async uploadVideosStream(): Promise<IUploadedFile[]> {
    return this.uploadVideos();
  }
}
