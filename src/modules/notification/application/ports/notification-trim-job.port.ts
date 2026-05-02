export interface INotificationTrimJobData {
  recipientUserIds: string[];
}

export interface INotificationTrimJobResult {
  processedRecipients: number;
}

export interface INotificationTrimQueue {
  add(data: INotificationTrimJobData): Promise<void>;
  close(): Promise<void>;
}
