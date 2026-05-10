export interface NotificationTrimJobData {
  recipientUserIds: string[];
}

export interface NotificationTrimJobResult {
  processedRecipients: number;
}

export interface NotificationTrimQueuePort {
  add(data: NotificationTrimJobData): Promise<void>;
  close(): Promise<void>;
}
