export const QUEUE_NAMES = {
  EMAIL: 'email',
  VIDEO_HLS: 'video-hls',
  NOTIFICATION_TRIM: 'notification-trim'
} as const;

export interface IEmailJobResult {
  sentAt: string; // ISO string
}

export interface IVideoHLSJobResult {
  idName: string;
}

export interface INotificationTrimJobData {
  recipientUserIds: string[];
}

export interface INotificationTrimJobResult {
  processedRecipients: number;
}
