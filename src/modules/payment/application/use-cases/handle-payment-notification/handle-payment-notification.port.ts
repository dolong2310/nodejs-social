import { UseCase } from '@/modules/core/application/base.usecase';
import { PaymentProvider } from '@/modules/payment/domain/entities/payment.type';
import { ApplyVerifiedOutcomeResult } from '@/modules/payment/domain/repositories/payment.repository';

export interface HandlePaymentNotificationProps {
  provider: PaymentProvider;
  payload: unknown;
}

export class HandlePaymentNotificationCommand implements HandlePaymentNotificationProps {
  provider: PaymentProvider;
  payload: unknown;

  constructor(payload: HandlePaymentNotificationProps) {
    this.provider = payload.provider;
    this.payload = payload.payload;
  }
}

export abstract class HandlePaymentNotificationPort implements UseCase<
  HandlePaymentNotificationCommand,
  ApplyVerifiedOutcomeResult
> {
  abstract execute(command: HandlePaymentNotificationCommand): Promise<ApplyVerifiedOutcomeResult>;
}
