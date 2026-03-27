export const QUEUE_NAMES = {
  EMAIL: 'email',
  VIDEO_HLS: 'video-hls'
} as const;

export interface IEmailJobResult {
  sentAt: string; // ISO string
}

export interface IVideoHLSJobResult {
  idName: string;
}
