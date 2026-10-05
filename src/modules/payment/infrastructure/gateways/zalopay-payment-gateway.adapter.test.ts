import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaymentCheckoutError } from '@/modules/payment/application/ports/payment-gateway.port';
import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentCheckoutProps, PaymentFullProps } from '@/modules/payment/domain/entities/payment.types';
import { generateMac } from '@longdoo/node-payment-gateway/zalopay';
import { ZalopayPaymentGatewayAdapter } from '@/modules/payment/infrastructure/gateways/zalopay-payment-gateway.adapter';

const appId = '2553';
const key1 = 'zalopay-test-key1';
const key2 = 'zalopay-test-key2';
const paymentPublicBaseUrl = 'https://social.example';

function createAdapter() {
  return new ZalopayPaymentGatewayAdapter({ appId, key1, key2, paymentPublicBaseUrl });
}

function createPayment(): PaymentCheckoutProps {
  const now = new Date('2026-09-25T00:00:00.000Z');
  const payment = PaymentEntity.create({
    userId: 'u_payment_test',
    provider: 'zalopay',
    ...createAdapter().createOrderReference(now),
    sourceReference: 'order_zalopay_adapter',
    description: 'ZaloPay adapter order',
    amountVnd: 10_000,
    idempotencyKey: 'zalopay-adapter-key',
    now
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

function signCallback(
  payment: PaymentCheckoutProps,
  overrides: Partial<Record<'app_id' | 'app_trans_id' | 'amount' | 'zp_trans_id', string | number>> = {},
  type: number | string = 1
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
  return { data, mac: generateMac(key2, data), type };
}

function stubCreateOrder(response: Record<string, unknown>) {
  const calls: { url: string; body: URLSearchParams }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(input), body: new URLSearchParams(String(init?.body)) });
      return Response.json(response);
    })
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('ZalopayPaymentGatewayAdapter', () => {
  it('creates a sandbox order with the stored app_trans_id, callback and redirect URLs', async () => {
    const payment = createPayment();
    const calls = stubCreateOrder({
      return_code: 1,
      return_message: 'Giao dịch thành công',
      sub_return_code: 1,
      sub_return_message: 'Giao dịch thành công',
      order_url: 'https://qcgateway.zalopay.vn/openinapp?order=test-token',
      zp_trans_token: 'test-token',
      order_token: 'test-token',
      qr_code: 'qr'
    });

    const checkoutUrl = await createAdapter().createCheckout(payment, '203.0.113.10');

    expect(calls).toHaveLength(1);
    const call = calls[0]!;
    expect(call.url).toBe('https://sb-openapi.zalopay.vn/v2/create');
    const body = call.body;
    expect(Object.fromEntries(body)).toMatchObject({
      app_id: appId,
      app_trans_id: payment.providerOrderId,
      app_user: 'nodejs-social',
      app_time: String(payment.createdAt.getTime()),
      amount: '10000',
      description: `ZaloPay adapter order ${payment.providerOrderId}`,
      callback_url: 'https://social.example/api/v1/payments/callbacks/zalopay/callback',
      expire_duration_seconds: '900',
      item: '[]'
    });
    expect(JSON.parse(body.get('embed_data')!)).toMatchObject({
      redirecturl: 'https://social.example/api/v1/payments/callbacks/zalopay/return'
    });
    const macInput = ['app_id', 'app_trans_id', 'app_user', 'amount', 'app_time', 'embed_data', 'item']
      .map((key) => body.get(key))
      .join('|');
    expect(body.get('mac')).toBe(generateMac(key1, macInput));
    expect(checkoutUrl).toBe('https://qcgateway.zalopay.vn/openinapp?order=test-token');
  });

  it('creates a yymmdd_ app_trans_id in Vietnam time that fits ZaloPay limits, with a 15 minute expiry', () => {
    const now = new Date('2026-10-01T18:30:00.000Z'); // 2026-10-02 01:30 in Vietnam
    const first = createAdapter().createOrderReference(now);
    const second = createAdapter().createOrderReference(now);

    expect(first.providerOrderId).toMatch(/^261002_[0-9a-f]{32}$/);
    expect(first.providerOrderId.length).toBeLessThanOrEqual(40);
    expect(first.providerOrderId).not.toBe(second.providerOrderId);
    expect(first.expiresAt).toEqual(new Date('2026-10-01T18:45:00.000Z'));
  });

  it('classifies a failed order as a definitive rejection, except duplicates', async () => {
    const payment = createPayment();
    stubCreateOrder({ return_code: 2, return_message: 'Fail', sub_return_code: -401, sub_return_message: 'Invalid' });

    await expect(createAdapter().createCheckout(payment, '203.0.113.10')).rejects.toMatchObject({
      classification: { kind: 'definitive_rejection', resultCode: '2:-401' }
    });

    stubCreateOrder({ return_code: 2, return_message: 'Fail', sub_return_code: -68, sub_return_message: 'Duplicate' });
    await expect(createAdapter().createCheckout(payment, '203.0.113.10')).rejects.toMatchObject({
      classification: { kind: 'uncertain', reason: 'unclassified' }
    });
  });

  it('treats an absent or foreign order_url as an uncertain create result', async () => {
    const payment = createPayment();
    stubCreateOrder({ return_code: 1, sub_return_code: 1, order_url: '' });
    await expect(createAdapter().createCheckout(payment, '203.0.113.10')).rejects.toMatchObject({
      classification: { kind: 'uncertain', reason: 'unclassified' }
    });

    stubCreateOrder({ return_code: 1, sub_return_code: 1, order_url: 'https://evil.example/pay' });
    await expect(createAdapter().createCheckout(payment, '203.0.113.10')).rejects.toThrow(PaymentCheckoutError);
  });

  it('classifies network failures and timeouts as uncertain', async () => {
    const payment = createPayment();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    await expect(createAdapter().createCheckout(payment, '203.0.113.10')).rejects.toMatchObject({
      classification: { kind: 'uncertain', reason: 'network' }
    });

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

  it('maps a verified callback to a succeeded notification', () => {
    const payment = createPayment();

    expect(createAdapter().verifyNotification(signCallback(payment))).toEqual({
      provider: 'zalopay',
      providerOrderId: payment.providerOrderId,
      amountVnd: 10_000,
      providerTransactionId: '260925000000123',
      resultCode: '1',
      outcome: 'succeeded'
    });
  });

  it('rejects a tampered callback', () => {
    const payment = createPayment();
    const payload = signCallback(payment);
    payload.data = payload.data.replace('"amount":10000', '"amount":10001');

    expect(() => createAdapter().verifyNotification(payload)).toThrowError(
      expect.objectContaining({ reason: 'invalid_signature' })
    );
  });

  it('rejects a correctly signed callback for another app', () => {
    const payment = createPayment();

    expect(() => createAdapter().verifyNotification(signCallback(payment, { app_id: 9999 }))).toThrowError(
      expect.objectContaining({ reason: 'merchant_mismatch' })
    );
  });

  it('rejects malformed payloads and non-order callback types', () => {
    const payment = createPayment();

    expect(() => createAdapter().verifyNotification(null)).toThrow(PaymentNotificationVerificationError);
    expect(() => createAdapter().verifyNotification({ data: '{}' })).toThrow(
      expect.objectContaining({ reason: 'invalid_payload' })
    );
    expect(() => createAdapter().verifyNotification(signCallback(payment, {}, 2))).toThrow(
      expect.objectContaining({ reason: 'invalid_payload' })
    );
    expect(() => createAdapter().verifyNotification(signCallback(payment, { zp_trans_id: 0 }))).toThrow(
      expect.objectContaining({ reason: 'invalid_payload' })
    );
  });
});
