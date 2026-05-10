export interface VideoStreamJobData {
  filepath: string; // Absolute path of the uploaded video file on disk
  idName: string; // Unique name/ID used for status tracking in DB
}

export interface VideoStreamJobResult {
  idName: string;
}

export interface VideoStreamQueuePort {
  add(data: VideoStreamJobData): Promise<void>;
  close(): Promise<void>;
}
