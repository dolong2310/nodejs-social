export interface IUploadFileResult {
  url: string;
}

export interface StoragePort {
  uploadFile(payload: { filename: string; filepath: string; contentType: string }): Promise<IUploadFileResult>;
  createPresignedUrl(filename: string): Promise<string>;
  sendFileFromS3(res: unknown, filepath: string): Promise<void>;
}
