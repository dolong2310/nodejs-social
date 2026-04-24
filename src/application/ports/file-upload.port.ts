export interface IUploadedFile {
  filepath: string;
  filename: string;
  mimetype: string;
}

export interface IFileUploadService {
  uploadImages(): Promise<IUploadedFile[]>;
  uploadVideos(): Promise<IUploadedFile[]>;
  uploadVideosStream(): Promise<IUploadedFile[]>;
}
