import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaymentCheckoutError } from '@/modules/payment/application/ports/payment-gateway.port';
import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentCheckoutProps, PaymentFullProps } from '@/modules/payment/domain/entities/payment.types';
import { Momo } from '@longdoo/node-payment-gateway';
import { MomoPaymentGatewayAdapter } from '@/modules/payment/infrastructure/gateways/momo-payment-gateway.adapter';

const partnerCode = 'MOMOTESTPARTNER';
const accessKey = 'test-access-key';
const secretKey = '0123456789ABCDEF0123456789ABCDEF';
const paymentPublicBaseUrl = 'https://social.example';

function createAdapter() {
  return new MomoPaymentGatewayAdapter({
    partnerCode,
    accessKey,
    secretKey,
    storeId: 'MomoTestStore',
    storeName: 'Social Test Store',
    paymentPublicBaseUrl
  });
}

function createPayment(): PaymentCheckoutProps {
  const payment = PaymentEntity.create({
    userId: 'u_payment_test',
    provider: 'momo',
    sourceReference: 'order_momo_adapter',
    description: 'MoMo adapter order',
    amountVnd: 10_000,
    idempotencyKey: 'momo-adapter-key',
    now: new Date('2026-09-25T00:00:00.000Z')
  }).toObject<PaymentFullProps>();
  return {
    provider: payment.provider,
    description: payment.description,
    amountVnd: payment.amountVnd,
    providerOrderId: payment.providerOrderId,
    providerRequestId: payment.providerRequestId,
    createdAt: payment.createdAt,
    expiresAt: payment.expiresAt
  };
}

function signIpn(
  payment: PaymentCheckoutProps,
  overrides: Partial<
    Record<
      | 'orderType'
      | 'amount'
      | 'partnerCode'
      | 'orderId'
      | 'extraData'
      | 'transId'
      | 'responseTime'
      | 'resultCode'
      | 'message'
      | 'payType'
      | 'requestId'
      | 'orderInfo',
      string | number
    >
  > = {}
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
  return {
    ...payload,
    signature: Momo.generateSignature(secretKey, rawSignature)
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('MomoPaymentGatewayAdapter', () => {
  it('builds a multi-method sandbox checkout using the stored order and request references', async () => {
    const payment = createPayment();
    let targetUrl = '';
    let body: Record<string, unknown> | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        targetUrl = String(input);
        body = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return Response.json({ payUrl: 'https://test-payment.momo.vn/pay?token=test-token', resultCode: 0 });
      })
    );

    const checkoutUrl = await createAdapter().createCheckout(payment, '203.0.113.10');

    expect(targetUrl).toBe('https://test-payment.momo.vn/v2/gateway/api/create');
    expect(body).toMatchObject({
      partnerCode,
      storeId: 'MomoTestStore',
      storeName: 'Social Test Store',
      requestType: 'payWithMethod',
      autoCapture: true,
      amount: 10_000,
      orderId: payment.providerOrderId,
      requestId: payment.providerRequestId,
      extraData: '',
      ipnUrl: 'https://social.example/api/v1/payments/callbacks/momo/ipn',
      redirectUrl: 'https://social.example/api/v1/payments/callbacks/momo/return'
    });
    expect(checkoutUrl).toBe('https://test-payment.momo.vn/pay?token=test-token');
  });

  it.each([
    [0, 'succeeded'],
    [9000, 'succeeded'],
    [1000, 'pending'],
    [7000, 'pending'],
    [7002, 'pending'],
    [10, 'pending'],
    [1001, 'failed'],
    [1003, 'failed'],
    [1005, 'failed'],
    [1006, 'cancelled'],
    [1017, 'cancelled'],
    [5555, 'pending']
  ] as const)('maps resultCode %s to %s for the multi-method flow', (resultCode, outcome) => {
    const payment = createPayment();
    const notification = createAdapter().verifyNotification(signIpn(payment, { resultCode }));

    expect(notification).toMatchObject({
      provider: 'momo',
      providerOrderId: payment.providerOrderId,
      providerRequestId: payment.providerRequestId,
      amountVnd: 10_000,
      providerTransactionId: '4088878653',
      resultCode: String(resultCode),
      outcome
    });
  });

  it('verifies the signature and accepts responseTime in epoch milliseconds', () => {
    const payment = createPayment();
    const payload = signIpn(payment, { responseTime: 1790294400123 });

    expect(createAdapter().verifyNotification(payload).providerRequestId).toBe(payment.providerRequestId);
  });

  it('rejects a tampered signature', () => {
    const payment = createPayment();
    const payload = signIpn(payment);
    payload.amount = payment.amountVnd + 1;

    expect(() => createAdapter().verifyNotification(payload)).toThrowError(
      expect.objectContaining({ reason: 'invalid_signature' })
    );
  });

  it('rejects a correctly signed notification for another partner', () => {
    const payment = createPayment();
    const payload = signIpn(payment, { partnerCode: 'OTHERPARTNER' });

    expect(() => createAdapter().verifyNotification(payload)).toThrowError(
      expect.objectContaining({ reason: 'merchant_mismatch' })
    );
  });

  it('treats an absent or non-sandbox payUrl as an uncertain create result', async () => {
    const payment = createPayment();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ resultCode: 13, message: 'Rejected' }))
    );

    await expect(createAdapter().createCheckout(payment, '203.0.113.10')).rejects.toMatchObject({
      classification: { kind: 'uncertain', reason: 'unclassified' }
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ payUrl: 'https://payment.momo.vn/pay?token=not-sandbox', resultCode: 0 }))
    );
    await expect(createAdapter().createCheckout(payment, '203.0.113.10')).rejects.toThrow(PaymentCheckoutError);
  });

  it('keeps a checkout timeout uncertain and does not retry it', async () => {
    const payment = createPayment();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined))
    );
    vi.useFakeTimers();
    const request = createAdapter().createCheckout(payment, '203.0.113.10');
    const rejection = expect(request).rejects.toMatchObject({
      classification: { kind: 'uncertain', reason: 'timeout' }
    });
    await vi.advanceTimersByTimeAsync(35_000);

    await rejection;
  });

  it('rejects malformed payload and preserves verification errors for callback mapping', () => {
    expect(() => createAdapter().verifyNotification(null)).toThrow(PaymentNotificationVerificationError);
    expect(() => createAdapter().verifyNotification({ partnerCode })).toThrow(
      expect.objectContaining({ reason: 'invalid_payload' })
    );
  });
});
