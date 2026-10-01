import { describe, expect, it } from 'vitest';
import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentCheckoutProps, PaymentFullProps } from '@/modules/payment/domain/entities/payment.types';
import { VNPay } from '@longdoo/node-payment-gateway';
import type { ReturnQueryFromVNPay } from '@longdoo/node-payment-gateway/vnpay';
import { VnpayPaymentGatewayAdapter } from '@/modules/payment/infrastructure/gateways/vnpay-payment-gateway.adapter';

const tmnCode = 'TESTTMNCODE';
const secureSecret = '0123456789ABCDEF0123456789ABCDEF';
const paymentPublicBaseUrl = 'https://social.example';

function createAdapter(overrides: Partial<{ tmnCode: string; secureSecret: string; vnpayHost: string }> = {}) {
  return new VnpayPaymentGatewayAdapter({
    tmnCode,
    secureSecret,
    vnpayHost: 'https://sandbox.vnpayment.vn',
    paymentPublicBaseUrl,
    ...overrides
  });
}

function createPayment(): PaymentCheckoutProps {
  const payment = PaymentEntity.create({
    userId: 'u_payment_test',
    provider: 'vnpay',
    sourceReference: 'order_vnpay_adapter',
    description: 'VNPay adapter order',
    amountVnd: 10_000,
    idempotencyKey: 'vnpay-adapter-key',
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

function signIpn(overrides: Record<string, string> = {}, merchantCode = tmnCode): ReturnQueryFromVNPay {
  const payload: Record<string, string> = {
    vnp_Amount: '1000000',
    vnp_BankCode: 'NCB',
    vnp_BankTranNo: 'NCB202609250001',
    vnp_CardType: 'ATM',
    vnp_OrderInfo: 'Example order',
    vnp_PayDate: '20260925070000',
    vnp_ResponseCode: '00',
    vnp_TmnCode: merchantCode,
    vnp_TransactionNo: '123456789012345',
    vnp_TransactionStatus: '00',
    vnp_TxnRef: 'po_test_1',
    ...overrides
  };
  const data = VNPay.buildPaymentUrlSearchParams(payload).toString();
  payload.vnp_SecureHash = VNPay.calculateSecureHash({
    secureSecret,
    data,
    hashAlgorithm: VNPay.HashAlgorithm.SHA512,
    bufferEncode: 'utf-8'
  });
  return payload as unknown as ReturnQueryFromVNPay;
}

describe('VnpayPaymentGatewayAdapter', () => {
  it('builds a sandbox URL with the provider-scaled VND amount and required GMT+7 expiry', async () => {
    const adapter = createAdapter({ vnpayHost: 'https://payment.vnpay.vn' });
    const payment = createPayment();

    const checkoutUrl = await adapter.createCheckout(payment, '203.0.113.10');
    const url = new URL(checkoutUrl);
    const query = Object.fromEntries(url.searchParams) as unknown as ReturnQueryFromVNPay;
    const verified = new VNPay.VNPay({ tmnCode, secureSecret, testMode: true, enableLog: false }).verifyReturnUrl(
      query
    );

    expect(url.origin).toBe('https://sandbox.vnpayment.vn');
    expect(url.searchParams.get('vnp_Amount')).toBe('1000000');
    expect(url.searchParams.get('vnp_TxnRef')).toBe(payment.providerOrderId);
    expect(url.searchParams.get('vnp_IpAddr')).toBe('203.0.113.10');
    expect(url.searchParams.get('vnp_ExpireDate')).toBe('20260925071500');
    expect(url.searchParams.get('vnp_ReturnUrl')).toBe('https://social.example/api/v1/payments/callbacks/vnpay/return');
    expect(verified.isVerified).toBe(true);
    expect(verified.vnp_Amount).toBe(10_000);
  });

  it('verifies a signed successful IPN and keeps the provider transaction number as a string', () => {
    const result = createAdapter().verifyNotification(signIpn());

    expect(result).toEqual({
      provider: 'vnpay',
      providerOrderId: 'po_test_1',
      amountVnd: 10_000,
      providerTransactionId: '123456789012345',
      resultCode: '00:00',
      outcome: 'succeeded'
    });
  });

  it.each([
    ['01', '00', 'pending'],
    ['00', '01', 'pending'],
    ['00', '02', 'failed'],
    ['24', '02', 'cancelled'],
    ['07', '07', 'pending'],
    ['99', '99', 'pending']
  ] as const)('maps response %s / transaction status %s to %s', (responseCode, transactionStatus, outcome) => {
    const result = createAdapter().verifyNotification(
      signIpn({ vnp_ResponseCode: responseCode, vnp_TransactionStatus: transactionStatus })
    );

    expect(result.outcome).toBe(outcome);
  });

  it('rejects a tampered IPN signature', () => {
    const payload = signIpn();
    payload.vnp_Amount = '1000001';

    expect(() => createAdapter().verifyNotification(payload)).toThrowError(
      expect.objectContaining({ reason: 'invalid_signature' })
    );
  });

  it('rejects a validly signed notification for another merchant', () => {
    const payload = signIpn({}, 'OTHERmerchant');

    expect(() => createAdapter().verifyNotification(payload)).toThrowError(
      expect.objectContaining({ reason: 'merchant_mismatch' })
    );
  });

  it('rejects a validly signed callback with no order reference', () => {
    const payload = signIpn();
    const unsignedPayload = payload as unknown as Record<string, string>;
    delete unsignedPayload.vnp_TxnRef;
    delete unsignedPayload.vnp_SecureHash;
    const data = VNPay.buildPaymentUrlSearchParams(unsignedPayload).toString();
    unsignedPayload.vnp_SecureHash = VNPay.calculateSecureHash({
      secureSecret,
      data,
      hashAlgorithm: VNPay.HashAlgorithm.SHA512,
      bufferEncode: 'utf-8'
    });

    expect(() => createAdapter().verifyNotification(payload)).toThrow(PaymentNotificationVerificationError);
    try {
      createAdapter().verifyNotification(payload);
    } catch (error) {
      expect(error).toMatchObject({ reason: 'invalid_payload' });
    }
  });
});
