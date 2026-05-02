export interface IVideoStreamJobData {
  filepath: string; // Absolute path of the uploaded video file on disk
  idName: string; // Unique name/ID used for status tracking in DB
}

export interface IVideoStreamJobResult {
  idName: string;
}

export interface IVideoStreamQueue {
  add(data: IVideoStreamJobData): Promise<void>;
  close(): Promise<void>;
}
