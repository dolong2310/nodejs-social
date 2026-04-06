export interface IStaticVideoStreamPayload {
  videoPath: string;
  videoSize: number;
  start: number;
  end: number;
  contentLength: number;
  contentType: string;
}
