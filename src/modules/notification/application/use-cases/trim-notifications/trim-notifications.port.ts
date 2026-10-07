import type { UseCase } from '@/modules/core/application/base.usecase';

export class TrimNotificationsInputPort {
  recipientUserIds: string[];
  constructor(payload: { recipientUserIds: string[] }) {
    this.recipientUserIds = payload.recipientUserIds;
  }
}

export class TrimNotificationsOutputPort {
  processedRecipients: number;
  constructor(payload: { processedRecipients: number }) {
    this.processedRecipients = payload.processedRecipients;
  }
}

export abstract class TrimNotificationsPort implements UseCase<
  TrimNotificationsInputPort,
  TrimNotificationsOutputPort
> {
  abstract execute(input: TrimNotificationsInputPort): Promise<TrimNotificationsOutputPort>;
}
