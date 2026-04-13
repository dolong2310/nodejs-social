export interface IVideoHLSJobData {
  filepath: string; // Absolute path of the uploaded video file on disk
  idName: string; // Unique name/ID used for status tracking in DB
}

export interface IVideoHLSJobResult {
  idName: string;
}

export interface IVideoHLSQueue {
  add(data: IVideoHLSJobData): Promise<void>;
  close(): Promise<void>;
}
