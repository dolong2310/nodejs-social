import { PaymentRecord } from '@/modules/payment/domain/entities/payment.type';

export class PaymentResponseDTO {
  paymentId: string;
  sourceReference: string;
  description: string;
  amountVnd: number;
  currency: 'VND';
  provider: PaymentRecord['provider'];
  status: PaymentRecord['status'];
  checkoutUrl: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(payment: PaymentRecord) {
    this.paymentId = payment.id;
    this.sourceReference = payment.sourceReference;
    this.description = payment.description;
    this.amountVnd = payment.amountVnd;
    this.currency = payment.currency;
    this.provider = payment.provider;
    this.status = payment.status;
    this.checkoutUrl = payment.expiresAt && payment.expiresAt.getTime() <= Date.now() ? null : payment.checkoutUrl;
    this.expiresAt = payment.expiresAt;
    this.createdAt = payment.createdAt;
    this.updatedAt = payment.updatedAt;
  }
}
