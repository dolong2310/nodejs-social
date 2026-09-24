import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type {
  PaymentProvider,
  PaymentRecord,
  VerifiedNotification
} from '@/modules/payment/domain/entities/payment.type';
import type {
  ApplyVerifiedOutcomeResult,
  PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';
import { Momo } from '@longdoo/node-payment-gateway';
import { MomoPaymentGatewayAdapter } from '@/modules/payment/infrastructure/gateways/momo-payment-gateway.adapter';
import { HandlePaymentNotificationUseCase } from '@/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.usecase';
import { PaymentCallbackController } from '@/presentation/http/express/v1/controllers/payment-callback.controller';
import { PaymentCallbackRoute } from '@/presentation/http/express/v1/routes/payment-callback.route';

const partnerCode = 'MOMOTESTPARTNER';
const accessKey = 'test-access-key';
const secretKey = '0123456789ABCDEF0123456789ABCDEF';

describe('MoMo payment HTTP e2e', () => {
  it('acknowledges an unauthenticated verified IPN only after applying it and treats retries as duplicates', async () => {
    const fixture = createFixture();
    const payload = signIpn(fixture.payment);

    const first = await request(fixture.app).post('/api/v1/payments/callbacks/momo/ipn').send(payload).expect(204);
    expect(first.text).toBe('');
    expect((await fixture.repository.findById(fixture.payment.id))?.status).toBe('succeeded');

    const duplicate = await request(fixture.app).post('/api/v1/payments/callbacks/momo/ipn').send(payload).expect(204);
    expect(duplicate.text).toBe('');
    expect((await fixture.repository.findById(fixture.payment.id))?.status).toBe('succeeded');
  });

  it('does not acknowledge invalid signature, wrong partner, amount or request reference', async () => {
    const fixture = createFixture();

    const invalidSignature = signIpn(fixture.payment);
    invalidSignature.amount = Number(invalidSignature.amount) + 1;
    await request(fixture.app).post('/api/v1/payments/callbacks/momo/ipn').send(invalidSignature).expect(400);

    await request(fixture.app)
      .post('/api/v1/payments/callbacks/momo/ipn')
      .send(signIpn(fixture.payment, { partnerCode: 'OTHERPARTNER' }))
      .expect(400);

    await request(fixture.app)
      .post('/api/v1/payments/callbacks/momo/ipn')
      .send(signIpn(fixture.payment, { amount: 10_001 }))
      .expect(400);

    await request(fixture.app)
      .post('/api/v1/payments/callbacks/momo/ipn')
      .send(signIpn(fixture.payment, { requestId: 'another-request' }))
      .expect(400);

    expect((await fixture.repository.findById(fixture.payment.id))?.status).toBe('pending');
  });

  it('does not acknowledge storage or state conflicts', async () => {
    const fixture = createFixture();
    fixture.repository.returnStateConflict = true;
    await request(fixture.app).post('/api/v1/payments/callbacks/momo/ipn').send(signIpn(fixture.payment)).expect(409);

    fixture.repository.returnStateConflict = false;
    fixture.repository.failApply = true;
    await request(fixture.app).post('/api/v1/payments/callbacks/momo/ipn').send(signIpn(fixture.payment)).expect(500);
  });

  it('keeps the MoMo return endpoint read-only', async () => {
    const fixture = createFixture();
    await request(fixture.app).get('/api/v1/payments/callbacks/momo/return').expect(200);
    expect((await fixture.repository.findById(fixture.payment.id))?.status).toBe('pending');
  });
});

function createFixture() {
  const repository = new InMemoryPaymentRepository();
  const payment = PaymentEntity.createExample({
    userId: 'u_momo_test',
    provider: 'momo',
    idempotencyKey: 'momo-http-e2e',
    now: new Date('2026-09-25T00:00:00.000Z')
  }).toObject() as PaymentRecord;
  repository.addRecord(payment);

  const momo = new MomoPaymentGatewayAdapter({
    partnerCode,
    accessKey,
    secretKey,
    storeId: 'MomoTestStore',
    storeName: 'Social Test Store',
    paymentPublicBaseUrl: 'https://social.example'
  });
  const vnpay = {
    createCheckout: async () => '',
    verifyNotification: () => {
      throw new Error('VNPay is not used in MoMo tests');
    }
  };
  const notificationUseCase = new HandlePaymentNotificationUseCase(repository, { momo, vnpay });
  const callbackController = new PaymentCallbackController(notificationUseCase);
  const callbackRoute = new PaymentCallbackRoute(callbackController);
  const app = express();
  app.use(express.json());
  app.use('/api/v1/payments/callbacks', callbackRoute.getRouter());

  return { app, payment, repository };
}

function signIpn(
  payment: PaymentRecord,
  overrides: Partial<Record<'amount' | 'partnerCode' | 'requestId', string | number>> = {}
) {
  const payload = {
    orderType: 'momo_wallet',
    amount: payment.amountVnd,
    partnerCode,
    orderId: payment.providerOrderId,
    extraData: '',
    transId: 4088878653,
    responseTime: 1790294400000,
    resultCode: 0,
    message: 'Successful.',
    payType: 'qr',
    requestId: payment.providerRequestId,
    orderInfo: `${payment.description} ${payment.providerOrderId}`,
    ...overrides
  };
  const rawSignature = [
    `accessKey=${accessKey}`,
    `amount=${payload.amount}`,
    `extraData=${payload.extraData}`,
    `message=${payload.message}`,
    `orderId=${payload.orderId}`,
    `orderInfo=${payload.orderInfo}`,
    `orderType=${payload.orderType}`,
    `partnerCode=${payload.partnerCode}`,
    `payType=${payload.payType}`,
    `requestId=${payload.requestId}`,
    `responseTime=${payload.responseTime}`,
    `resultCode=${payload.resultCode}`,
    `transId=${payload.transId}`
  ].join('&');
  return { ...payload, signature: Momo.generateSignature(secretKey, rawSignature) };
}

class InMemoryPaymentRepository implements PaymentRepositoryPort {
  private readonly records = new Map<string, PaymentRecord>();
  failApply = false;
  returnStateConflict = false;

  addRecord(payment: PaymentRecord): void {
    this.records.set(payment.id, { ...payment, status: 'pending' });
  }

  async insertOrFindByIdempotency(record: PaymentRecord) {
    const existing = [...this.records.values()].find(
      (candidate) => candidate.userId === record.userId && candidate.idempotencyKey === record.idempotencyKey
    );
    if (existing) return { record: existing, inserted: false };
    this.records.set(record.id, record);
    return { record, inserted: true };
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    return this.records.get(id) ?? null;
  }

  async findByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentRecord | null> {
    return (
      [...this.records.values()].find((record) => record.provider === provider && record.providerOrderId === orderId) ??
      null
    );
  }

  async attachCheckoutUrlIfAbsent(id: string, url: string): Promise<PaymentRecord> {
    const record = this.requireRecord(id);
    const updated = { ...record, checkoutUrl: url, status: record.status === 'creating' ? 'pending' : record.status };
    this.records.set(id, updated);
    return updated;
  }

  async setUnknownIfCreating(id: string): Promise<PaymentRecord> {
    const record = this.requireRecord(id);
    const updated = { ...record, status: record.status === 'creating' ? 'unknown' : record.status };
    this.records.set(id, updated);
    return updated;
  }

  async setCreateFailedIfCreating(id: string, resultCode: string): Promise<PaymentRecord> {
    const record = this.requireRecord(id);
    const updated = {
      ...record,
      status: record.status === 'creating' ? 'create_failed' : record.status,
      providerResultCode: record.status === 'creating' ? resultCode : record.providerResultCode
    };
    this.records.set(id, updated);
    return updated;
  }

  async applyVerifiedOutcome(input: VerifiedNotification): Promise<ApplyVerifiedOutcomeResult> {
    if (this.failApply) throw new Error('database unavailable');
    if (this.returnStateConflict) return 'state_conflict';
    const record = await this.findByProviderOrderId(input.provider, input.providerOrderId);
    if (!record) return 'not_found';
    if (record.amountVnd !== input.amountVnd) return 'amount_mismatch';
    if (record.providerRequestId !== input.providerRequestId) return 'reference_mismatch';
    if (record.status === input.outcome && record.providerTransactionId === input.providerTransactionId)
      return 'duplicate';
    if (['succeeded', 'failed', 'cancelled'].includes(record.status)) return 'state_conflict';
    this.records.set(record.id, {
      ...record,
      status: input.outcome,
      providerTransactionId: input.providerTransactionId,
      providerResultCode: input.resultCode
    });
    return 'applied';
  }

  private requireRecord(id: string): PaymentRecord {
    const record = this.records.get(id);
    if (!record) throw new Error(`Missing test payment ${id}`);
    return record;
  }
}
