import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaymentCheckoutError } from '@/modules/payment/application/ports/payment-gateway.port';
import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentRecord } from '@/modules/payment/domain/entities/payment.type';
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

function createRecord(): PaymentRecord {
  return PaymentEntity.createExample({
    userId: 'u_payment_test',
    provider: 'momo',
    idempotencyKey: 'momo-adapter-key',
    now: new Date('2026-09-25T00:00:00.000Z')
  }).toObject() as PaymentRecord;
}

function signIpn(
  record: PaymentRecord,
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
    amount: record.amountVnd,
    partnerCode,
    orderId: record.providerOrderId,
    extraData: '',
    transId: 4088878653,
    responseTime: 1790294400000,
    resultCode: 0,
    message: 'Successful.',
    payType: 'qr',
    requestId: record.providerRequestId,
    orderInfo: `${record.description} ${record.providerOrderId}`,
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
  it('builds a one-step sandbox checkout using the stored order and request references', async () => {
    const record = createRecord();
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

    const checkoutUrl = await createAdapter().createCheckout(record, '203.0.113.10');

    expect(targetUrl).toBe('https://test-payment.momo.vn/v2/gateway/api/create');
    expect(body).toMatchObject({
      partnerCode,
      storeId: 'MomoTestStore',
      storeName: 'Social Test Store',
      requestType: 'captureWallet',
      autoCapture: true,
      amount: 10_000,
      orderId: record.providerOrderId,
      requestId: record.providerRequestId,
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
  ] as const)('maps resultCode %s to %s for the one-step wallet flow', (resultCode, outcome) => {
    const record = createRecord();
    const notification = createAdapter().verifyNotification(signIpn(record, { resultCode }));

    expect(notification).toMatchObject({
      provider: 'momo',
      providerOrderId: record.providerOrderId,
      providerRequestId: record.providerRequestId,
      amountVnd: 10_000,
      providerTransactionId: '4088878653',
      resultCode: String(resultCode),
      outcome
    });
  });

  it('verifies the signature and accepts responseTime in epoch milliseconds', () => {
    const record = createRecord();
    const payload = signIpn(record, { responseTime: 1790294400123 });

    expect(createAdapter().verifyNotification(payload).providerRequestId).toBe(record.providerRequestId);
  });

  it('rejects a tampered signature', () => {
    const record = createRecord();
    const payload = signIpn(record);
    payload.amount = record.amountVnd + 1;

    expect(() => createAdapter().verifyNotification(payload)).toThrowError(
      expect.objectContaining({ reason: 'invalid_signature' })
    );
  });

  it('rejects a correctly signed notification for another partner', () => {
    const record = createRecord();
    const payload = signIpn(record, { partnerCode: 'OTHERPARTNER' });

    expect(() => createAdapter().verifyNotification(payload)).toThrowError(
      expect.objectContaining({ reason: 'merchant_mismatch' })
    );
  });

  it('treats an absent or non-sandbox payUrl as an uncertain create result', async () => {
    const record = createRecord();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ resultCode: 13, message: 'Rejected' }))
    );

    await expect(createAdapter().createCheckout(record, '203.0.113.10')).rejects.toMatchObject({
      classification: { kind: 'uncertain', reason: 'unclassified' }
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ payUrl: 'https://payment.momo.vn/pay?token=not-sandbox', resultCode: 0 }))
    );
    await expect(createAdapter().createCheckout(record, '203.0.113.10')).rejects.toThrow(PaymentCheckoutError);
  });

  it('keeps a checkout timeout uncertain and does not retry it', async () => {
    const record = createRecord();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined))
    );
    vi.useFakeTimers();
    const request = createAdapter().createCheckout(record, '203.0.113.10');
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
