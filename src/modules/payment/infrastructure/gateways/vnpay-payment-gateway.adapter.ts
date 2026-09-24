import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import { PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import { PaymentRecord, VerifiedNotification } from '@/modules/payment/domain/entities/payment.type';
import { VNPay } from '@longdoo/node-payment-gateway';
import type { ReturnQueryFromVNPay } from '@longdoo/node-payment-gateway/vnpay';

export interface VnpayPaymentGatewayAdapterConfig {
  tmnCode: string;
  secureSecret: string;
  vnpayHost: string;
  paymentPublicBaseUrl: string;
}

const VNPAY_CALLBACK_RETURN_PATH = '/api/v1/payments/callbacks/vnpay/return';
const VNPAY_FINAL_FAILURE_CODES = new Set(['09', '10', '11', '12', '13', '51', '65', '75', '79']);

export class VnpayPaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly client: InstanceType<typeof VNPay.VNPay>;
  private readonly returnUrl: string;

  constructor(private readonly config: VnpayPaymentGatewayAdapterConfig) {
    this.client = new VNPay.VNPay({
      tmnCode: config.tmnCode,
      secureSecret: config.secureSecret,
      vnpayHost: config.vnpayHost,
      testMode: true,
      enableLog: false,
      hashAlgorithm: VNPay.HashAlgorithm.SHA512
    });
    this.returnUrl = new URL(VNPAY_CALLBACK_RETURN_PATH, config.paymentPublicBaseUrl).toString();
  }

  async createCheckout(record: PaymentRecord, clientIp: string): Promise<string> {
    if (record.provider !== 'vnpay') throw new Error('VNPay adapter cannot create a checkout for another provider');
    if (!record.expiresAt) throw new Error('VNPay payment expiry is required');

    return this.client.buildPaymentUrl({
      vnp_Amount: record.amountVnd,
      vnp_IpAddr: clientIp,
      vnp_TxnRef: record.providerOrderId,
      vnp_OrderInfo: `${record.description} ${record.providerOrderId}`,
      vnp_OrderType: VNPay.ProductCode.Other,
      vnp_ReturnUrl: this.returnUrl,
      vnp_Locale: VNPay.VnpLocale.VN,
      vnp_CreateDate: VNPay.dateFormat(record.createdAt),
      vnp_ExpireDate: VNPay.dateFormat(record.expiresAt)
    });
  }

  verifyNotification(payload: unknown): VerifiedNotification {
    const query = this.toProviderQuery(payload);
    let verified: ReturnType<typeof this.client.verifyIpnCall>;
    try {
      verified = this.client.verifyIpnCall(query);
    } catch {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    if (!verified.isVerified) throw new PaymentNotificationVerificationError('invalid_signature');
    if (!verified.vnp_TmnCode) throw new PaymentNotificationVerificationError('invalid_payload');
    if (verified.vnp_TmnCode !== this.config.tmnCode) {
      throw new PaymentNotificationVerificationError('merchant_mismatch');
    }

    const providerOrderId = this.requiredString(verified.vnp_TxnRef);
    const transactionNumber = this.requiredString(verified.vnp_TransactionNo);
    const responseCode = this.requiredString(verified.vnp_ResponseCode);
    const transactionStatus = this.requiredString(verified.vnp_TransactionStatus);
    const amountVnd = Number(verified.vnp_Amount);
    if (!Number.isSafeInteger(amountVnd) || amountVnd <= 0) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    return {
      provider: 'vnpay',
      providerOrderId,
      amountVnd,
      providerTransactionId: transactionNumber,
      resultCode: `${responseCode}:${transactionStatus}`,
      outcome: this.getOutcome(responseCode, transactionStatus)
    };
  }

  private toProviderQuery(payload: unknown): ReturnQueryFromVNPay {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(payload)) {
      if (!key.startsWith('vnp_')) continue;
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new PaymentNotificationVerificationError('invalid_payload');
      }
      query[key] = String(value);
    }
    return query as unknown as ReturnQueryFromVNPay;
  }

  private requiredString(value: string | number | undefined): string {
    const normalized = value === undefined ? '' : String(value).trim();
    if (!normalized) throw new PaymentNotificationVerificationError('invalid_payload');
    return normalized;
  }

  private getOutcome(responseCode: string, transactionStatus: string): VerifiedNotification['outcome'] {
    if (responseCode === '00' && transactionStatus === '00') return 'succeeded';
    if (transactionStatus === '01') return 'pending';
    if (responseCode === '24') return 'cancelled';
    if (transactionStatus === '02' || VNPAY_FINAL_FAILURE_CODES.has(responseCode)) return 'failed';
    return 'pending';
  }
}
