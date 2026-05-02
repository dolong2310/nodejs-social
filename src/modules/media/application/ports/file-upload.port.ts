export interface UploadedFilePort {
  filepath: string;
  filename: string;
  mimetype: string;
}

export interface FileUploadPort {
  uploadImages(): Promise<UploadedFilePort[]>;
  uploadVideos(): Promise<UploadedFilePort[]>;
  uploadVideosStream(): Promise<UploadedFilePort[]>;
}
