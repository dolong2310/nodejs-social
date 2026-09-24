import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import { PaymentCheckoutError, PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import { PaymentRecord, VerifiedNotification } from '@/modules/payment/domain/entities/payment.type';
import { Momo } from '@longdoo/node-payment-gateway';
import type { ReturnQueryFromMomo } from '@longdoo/node-payment-gateway/momo';

export interface MomoPaymentGatewayAdapterConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  storeId: string;
  storeName: string;
  paymentPublicBaseUrl: string;
}

const MOMO_CALLBACK_IPN_PATH = '/api/v1/payments/callbacks/momo/ipn';
const MOMO_CALLBACK_RETURN_PATH = '/api/v1/payments/callbacks/momo/return';
const MOMO_GATEWAY_TIMEOUT_MS = 35_000;
const MOMO_FINAL_FAILURE_CODES = new Set([
  98, 99, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1017, 1026, 1080, 1081, 1088, 2019, 4001, 4002, 4100
]);
const MOMO_CANCELLATION_CODES = new Set([1006, 1017]);

export class MomoPaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly client: InstanceType<typeof Momo.Momo>;
  private readonly ipnUrl: string;
  private readonly redirectUrl: string;

  constructor(private readonly config: MomoPaymentGatewayAdapterConfig) {
    this.client = new Momo.Momo({
      partnerCode: config.partnerCode,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      storeId: config.storeId,
      storeName: config.storeName,
      requestType: Momo.RequestType.CAPTURE_WALLET,
      lang: Momo.MomoLocale.VI,
      testMode: true,
      enableLog: false
    });
    this.ipnUrl = new URL(MOMO_CALLBACK_IPN_PATH, config.paymentPublicBaseUrl).toString();
    this.redirectUrl = new URL(MOMO_CALLBACK_RETURN_PATH, config.paymentPublicBaseUrl).toString();
  }

  async createCheckout(record: PaymentRecord, clientIp: string): Promise<string> {
    void clientIp;
    if (record.provider !== 'momo') throw new Error('MoMo adapter cannot create a checkout for another provider');

    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const sdkRequest = this.client.buildPaymentUrl({
        requestType: Momo.RequestType.CAPTURE_WALLET,
        autoCapture: true,
        amount: record.amountVnd,
        orderId: record.providerOrderId,
        requestId: record.providerRequestId,
        orderInfo: `${record.description} ${record.providerOrderId}`,
        redirectUrl: this.redirectUrl,
        ipnUrl: this.ipnUrl,
        extraData: '',
        storeName: this.config.storeName
      });
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new PaymentCheckoutError(
              { kind: 'uncertain', reason: 'timeout' },
              'MoMo checkout request exceeded its 35 second deadline'
            )
          );
        }, MOMO_GATEWAY_TIMEOUT_MS);
      });
      const checkoutUrl = await Promise.race([sdkRequest, timeout]);
      return this.validateCheckoutUrl(checkoutUrl);
    } catch (error) {
      if (error instanceof PaymentCheckoutError) throw error;
      // The published SDK does not preserve HTTP status/resultCode, so these failures may have reached MoMo.
      throw new PaymentCheckoutError(
        { kind: 'uncertain', reason: 'unclassified' },
        'MoMo checkout result is uncertain'
      );
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  verifyNotification(payload: unknown): VerifiedNotification {
    const query = this.toProviderQuery(payload);
    let isVerified: boolean;
    try {
      // The SDK's verifyIpnCall also resolves a result-code message and throws on undocumented codes.
      isVerified = Momo.verifySignature({ ...query, accessKey: this.config.accessKey }, this.config.secretKey);
    } catch {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    if (!isVerified) throw new PaymentNotificationVerificationError('invalid_signature');
    if (query.partnerCode !== this.config.partnerCode) {
      throw new PaymentNotificationVerificationError('merchant_mismatch');
    }

    const amountVnd = Number(query.amount);
    const providerOrderId = this.requiredString(query.orderId);
    const providerRequestId = this.requiredString(query.requestId);
    const transactionId = this.requiredTransactionId(query.transId);
    const resultCode = Number(query.resultCode);
    if (!Number.isSafeInteger(amountVnd) || amountVnd <= 0 || !Number.isSafeInteger(resultCode)) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    return {
      provider: 'momo',
      providerOrderId,
      providerRequestId,
      amountVnd,
      providerTransactionId: transactionId === '0' ? null : transactionId,
      resultCode: String(resultCode),
      outcome: this.getOutcome(resultCode)
    };
  }

  private toProviderQuery(payload: unknown): ReturnQueryFromMomo {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }
    const input = payload as Record<string, unknown>;
    const resultCode = this.toInteger(input.resultCode);
    const amount = this.toInteger(input.amount);
    const responseTime = this.toInteger(input.responseTime);
    const transId = this.requiredTransactionId(input.transId);
    if (resultCode === null || amount === null || responseTime === null || transId === null) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    return {
      orderType: this.requiredString(input.orderType),
      amount,
      partnerCode: this.requiredString(input.partnerCode),
      orderId: this.requiredString(input.orderId),
      extraData: this.requiredString(input.extraData, true),
      signature: this.requiredString(input.signature),
      transId: Number(transId),
      responseTime,
      resultCode,
      message: this.requiredString(input.message, true),
      payType: this.requiredString(input.payType),
      requestId: this.requiredString(input.requestId),
      orderInfo: this.requiredString(input.orderInfo, true)
    };
  }

  private requiredString(value: unknown, allowEmpty = false): string {
    if (typeof value !== 'string' || (!allowEmpty && value.trim().length === 0)) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }
    return value;
  }

  private requiredTransactionId(value: unknown): string | null {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value);
    if (typeof value === 'string' && /^\d+$/.test(value)) return value;
    return null;
  }

  private toInteger(value: unknown): number | null {
    if (typeof value === 'number' && Number.isSafeInteger(value)) return value;
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) ? parsed : null;
    }
    return null;
  }

  private getOutcome(resultCode: number): VerifiedNotification['outcome'] {
    if (resultCode === 0 || resultCode === 9000) return 'succeeded';
    if (MOMO_CANCELLATION_CODES.has(resultCode)) return 'cancelled';
    if (MOMO_FINAL_FAILURE_CODES.has(resultCode)) return 'failed';
    return 'pending';
  }

  private validateCheckoutUrl(value: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new PaymentCheckoutError(
        { kind: 'uncertain', reason: 'unclassified' },
        'MoMo did not return a checkout URL'
      );
    }

    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(value);
    } catch {
      throw new PaymentCheckoutError(
        { kind: 'uncertain', reason: 'unclassified' },
        'MoMo returned an invalid checkout URL'
      );
    }
    if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'test-payment.momo.vn') {
      throw new PaymentCheckoutError(
        { kind: 'uncertain', reason: 'unclassified' },
        'MoMo returned a checkout URL outside its sandbox host'
      );
    }
    return checkoutUrl.toString();
  }
}
