import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentFullProps } from '@/modules/payment/domain/entities/payment.types';
import { InMemoryPaymentRepository } from '@test/support/doubles/payment-repository.double';
import { generateSignature } from '@longdoo/node-payment-gateway/momo';
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
    expect((await fixture.repository.findPaymentById(fixture.payment.id))?.getProps().status).toBe('succeeded');

    const duplicate = await request(fixture.app).post('/api/v1/payments/callbacks/momo/ipn').send(payload).expect(204);
    expect(duplicate.text).toBe('');
    expect((await fixture.repository.findPaymentById(fixture.payment.id))?.getProps().status).toBe('succeeded');
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

    expect((await fixture.repository.findPaymentById(fixture.payment.id))?.getProps().status).toBe('pending');
  });

  it('does not acknowledge storage or state conflicts', async () => {
    const fixture = createFixture();
    fixture.repository.conflictOnSave = true;
    await request(fixture.app).post('/api/v1/payments/callbacks/momo/ipn').send(signIpn(fixture.payment)).expect(409);

    fixture.repository.conflictOnSave = false;
    fixture.repository.failStorage = true;
    await request(fixture.app).post('/api/v1/payments/callbacks/momo/ipn').send(signIpn(fixture.payment)).expect(500);
  });

  it('keeps the MoMo return endpoint read-only', async () => {
    const fixture = createFixture();
    await request(fixture.app).get('/api/v1/payments/callbacks/momo/return').expect(200);
    expect((await fixture.repository.findPaymentById(fixture.payment.id))?.getProps().status).toBe('pending');
  });
});

function createFixture() {
  const repository = new InMemoryPaymentRepository();
  const payment = PaymentEntity.create({
    userId: 'u_momo_test',
    provider: 'momo',
    providerOrderId: 'po_momo_http_e2e',
    expiresAt: null,
    sourceReference: 'order_momo_http_e2e',
    description: 'MoMo HTTP e2e order',
    amountVnd: 10_000,
    idempotencyKey: 'momo-http-e2e',
    now: new Date('2026-09-25T00:00:00.000Z')
  }).toObject<PaymentFullProps>();
  repository.addRecord({ ...payment, status: 'pending' });

  const momo = new MomoPaymentGatewayAdapter({
    partnerCode,
    accessKey,
    secretKey,
    storeId: 'MomoTestStore',
    storeName: 'Social Test Store',
    paymentPublicBaseUrl: 'https://social.test'
  });
  const vnpay = {
    createOrderReference: () => ({ providerOrderId: 'unused', expiresAt: null }),
    createCheckout: async () => '',
    verifyNotification: () => {
      throw new Error('VNPay is not used in MoMo tests');
    }
  };
  const zalopay = {
    createOrderReference: () => ({ providerOrderId: 'unused', expiresAt: null }),
    createCheckout: async () => '',
    verifyNotification: () => {
      throw new Error('ZaloPay is not used in MoMo tests');
    }
  };
  const notificationUseCase = new HandlePaymentNotificationUseCase(repository, { momo, vnpay, zalopay });
  const callbackController = new PaymentCallbackController(notificationUseCase);
  const callbackRoute = new PaymentCallbackRoute(callbackController);
  const app = express();
  app.use(express.json());
  app.use('/api/v1/payments/callbacks', callbackRoute.getRouter());

  return { app, payment, repository };
}

function signIpn(
  payment: PaymentFullProps,
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
  return { ...payload, signature: generateSignature(secretKey, rawSignature) };
}
