import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentFullProps, VerifiedNotification } from '@/modules/payment/domain/entities/payment.types';
import type {
  ApplyVerifiedOutcomeResult,
  PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';
import { generateMac } from '@longdoo/node-payment-gateway/zalopay';
import { ZalopayPaymentGatewayAdapter } from '@/modules/payment/infrastructure/gateways/zalopay-payment-gateway.adapter';
import { HandlePaymentNotificationUseCase } from '@/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.usecase';
import { PaymentCallbackController } from '@/presentation/http/express/v1/controllers/payment-callback.controller';
import { PaymentCallbackRoute } from '@/presentation/http/express/v1/routes/payment-callback.route';

const appId = '2553';
const key2 = 'zalopay-test-key2';
const callbackPath = '/api/v1/payments/callbacks/zalopay/callback';

describe('ZaloPay payment HTTP e2e', () => {
  it('acknowledges a verified callback only after applying it and treats retries as duplicates', async () => {
    const fixture = createFixture();
    const payload = signCallback(fixture.payment);

    const first = await request(fixture.app).post(callbackPath).send(payload).expect(200);
    expect(first.body).toEqual({ return_code: 1, return_message: 'Success' });
    expect(fixture.repository.status).toBe('succeeded');

    const duplicate = await request(fixture.app).post(callbackPath).send(payload).expect(200);
    expect(duplicate.body).toEqual({ return_code: 2, return_message: 'Order already confirmed' });
  });

  it('rejects invalid signature, wrong app, unknown order and wrong amount without retry', async () => {
    const fixture = createFixture();

    const invalidSignature = signCallback(fixture.payment);
    invalidSignature.mac = generateMac('wrong-key', invalidSignature.data);
    const cases = [
      [invalidSignature, 'Invalid signature'],
      [signCallback(fixture.payment, { app_id: 9999 }), 'Invalid signature'],
      [signCallback(fixture.payment, { app_trans_id: '260925_unknown' }), 'Order not found'],
      [signCallback(fixture.payment, { amount: 10_001 }), 'Invalid amount']
    ] as const;

    for (const [payload, message] of cases) {
      const response = await request(fixture.app).post(callbackPath).send(payload).expect(200);
      expect(response.body).toEqual({ return_code: -1, return_message: message });
    }
    expect(fixture.repository.status).toBe('pending');
  });

  it('asks ZaloPay to retry on storage errors or state conflicts', async () => {
    const fixture = createFixture();
    fixture.repository.failApply = true;
    const failed = await request(fixture.app).post(callbackPath).send(signCallback(fixture.payment)).expect(200);
    expect(failed.body).toEqual({ return_code: 0, return_message: 'Unknown error' });

    fixture.repository.failApply = false;
    fixture.repository.returnStateConflict = true;
    const conflict = await request(fixture.app).post(callbackPath).send(signCallback(fixture.payment)).expect(200);
    expect(conflict.body).toEqual({ return_code: 0, return_message: 'Unknown error' });
  });

  it('keeps the ZaloPay return endpoint read-only', async () => {
    const fixture = createFixture();
    await request(fixture.app).get('/api/v1/payments/callbacks/zalopay/return').expect(200);
    expect(fixture.repository.status).toBe('pending');
  });
});

function createFixture() {
  const payment = PaymentEntity.create({
    userId: 'u_zalopay_test',
    provider: 'zalopay',
    providerOrderId: '260925_zalopayhttpe2e',
    expiresAt: new Date('2026-09-25T00:15:00.000Z'),
    sourceReference: 'order_zalopay_http_e2e',
    description: 'ZaloPay HTTP e2e order',
    amountVnd: 10_000,
    idempotencyKey: 'zalopay-http-e2e',
    now: new Date('2026-09-25T00:00:00.000Z')
  }).toObject<PaymentFullProps>();
  const repository = new SinglePaymentRepository(payment);

  const zalopay = new ZalopayPaymentGatewayAdapter({
    appId,
    key1: 'zalopay-test-key1',
    key2,
    paymentPublicBaseUrl: 'https://social.test'
  });
  const unused = {
    createOrderReference: () => ({ providerOrderId: 'unused', expiresAt: null }),
    createCheckout: async () => '',
    verifyNotification: () => {
      throw new Error('Provider is not used in ZaloPay tests');
    }
  };
  const notificationUseCase = new HandlePaymentNotificationUseCase(repository as unknown as PaymentRepositoryPort, {
    vnpay: unused,
    momo: unused,
    zalopay
  });
  const callbackRoute = new PaymentCallbackRoute(new PaymentCallbackController(notificationUseCase));
  const app = express();
  app.use(express.json());
  app.use('/api/v1/payments/callbacks', callbackRoute.getRouter());

  return { app, payment, repository };
}

function signCallback(
  payment: PaymentFullProps,
  overrides: Partial<Record<'app_id' | 'app_trans_id' | 'amount', string | number>> = {}
) {
  const data = JSON.stringify({
    app_id: Number(appId),
    app_trans_id: payment.providerOrderId,
    app_time: payment.createdAt.getTime(),
    app_user: 'nodejs-social',
    amount: payment.amountVnd,
    embed_data: '{}',
    item: '[]',
    zp_trans_id: 260925000000123,
    server_time: 1790294400000,
    channel: 38,
    merchant_user_id: 'merchant-user',
    user_fee_amount: 0,
    discount_amount: 0,
    ...overrides
  });
  return { data, mac: generateMac(key2, data), type: 1 };
}

class SinglePaymentRepository {
  status: PaymentFullProps['status'] = 'pending';
  providerTransactionId: string | null = null;
  failApply = false;
  returnStateConflict = false;

  constructor(private readonly payment: PaymentFullProps) {}

  async applyVerifiedOutcome(input: VerifiedNotification): Promise<ApplyVerifiedOutcomeResult> {
    if (this.failApply) throw new Error('database unavailable');
    if (this.returnStateConflict) return 'state_conflict';
    if (input.provider !== 'zalopay' || input.providerOrderId !== this.payment.providerOrderId) return 'not_found';
    if (input.amountVnd !== this.payment.amountVnd) return 'amount_mismatch';
    if (this.status === input.outcome && this.providerTransactionId === input.providerTransactionId) {
      return 'duplicate';
    }
    this.status = input.outcome;
    this.providerTransactionId = input.providerTransactionId;
    return 'applied';
  }
}
