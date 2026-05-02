import { FileUploadPort, UploadedFilePort } from '@/modules/core/application/ports/file-upload.port';
import { Request } from 'express';
import formidable, { File } from 'formidable';

export class FormidableFileUploadService implements FileUploadPort {
  constructor(private readonly req: Request) {}

  private map(file: File): UploadedFilePort {
    return {
      filepath: file.filepath,
      filename: file.newFilename,
      mimetype: file.mimetype ?? 'application/octet-stream'
    };
  }

  async uploadImages(): Promise<UploadedFilePort[]> {
    const form = formidable({ multiples: true });

    return new Promise((resolve, reject) => {
      form.parse(this.req, (err, _, files) => {
        if (err) return reject(err);
        const list = files.image as File[];
        resolve(list.map(this.map));
      });
    });
  }

  async uploadVideos(): Promise<UploadedFilePort[]> {
    const form = formidable({ multiples: true });

    return new Promise((resolve, reject) => {
      form.parse(this.req, (err, _, files) => {
        if (err) return reject(err);
        const list = files.video as File[];
        resolve(list.map(this.map));
      });
    });
  }

  async uploadVideosStream(): Promise<UploadedFilePort[]> {
    return this.uploadVideos();
  }
}
