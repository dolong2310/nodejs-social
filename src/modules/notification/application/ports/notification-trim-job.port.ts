export interface INotificationTrimJobData {
  recipientUserIds: string[];
}

export interface INotificationTrimJobResult {
  processedRecipients: number;
}

export interface NotificationTrimQueuePort {
  add(data: INotificationTrimJobData): Promise<void>;
  close(): Promise<void>;
}
