import type { UseCase } from '@/modules/core/application/base.usecase';
import type { PaymentOutcomeResult, PaymentProvider } from '@/modules/payment/domain/entities/payment.types';

export type HandlePaymentNotificationResult = PaymentOutcomeResult | 'not_found';

export interface HandlePaymentNotificationProps {
  provider: PaymentProvider;
  payload: unknown;
}

export class HandlePaymentNotificationInputPort implements HandlePaymentNotificationProps {
  provider: PaymentProvider;
  payload: unknown;

  constructor(payload: HandlePaymentNotificationProps) {
    this.provider = payload.provider;
    this.payload = payload.payload;
  }
}

export abstract class HandlePaymentNotificationPort implements UseCase<
  HandlePaymentNotificationInputPort,
  HandlePaymentNotificationResult
> {
  abstract execute(input: HandlePaymentNotificationInputPort): Promise<HandlePaymentNotificationResult>;
}
