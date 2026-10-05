import { generateId } from '@/modules/core/domain/helpers/ids';
import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import {
  PaymentCheckoutError,
  type PaymentGatewayPort,
  type ProviderOrderReference
} from '@/modules/payment/application/ports/payment-gateway.port';
import type { PaymentCheckoutProps, VerifiedNotification } from '@/modules/payment/domain/entities/payment.types';
import {
  ZaloPay,
  ZaloPayLocale,
  ZaloPayReturnCode,
  ZaloPaySubReturnCode,
  generateAppTransId,
  type CreateOrderResponse,
  type ZaloPayCallbackBody
} from '@longdoo/node-payment-gateway/zalopay';

export interface ZalopayPaymentGatewayAdapterConfig {
  appId: string;
  key1: string;
  key2: string;
  paymentPublicBaseUrl: string;
}

const ZALOPAY_CALLBACK_PATH = '/api/v1/payments/callbacks/zalopay/callback';
const ZALOPAY_CALLBACK_RETURN_PATH = '/api/v1/payments/callbacks/zalopay/return';
const ZALOPAY_GATEWAY_TIMEOUT_MS = 35_000;
const ZALOPAY_APP_USER = 'nodejs-social';
const ZALOPAY_ORDER_CALLBACK_TYPE = 1;
// ZaloPay only sends the order callback after the payment has been captured.
const ZALOPAY_SUCCESS_RESULT_CODE = String(ZaloPayReturnCode.SUCCESS);
const ZALOPAY_CHECKOUT_HOST_SUFFIX = '.zalopay.vn';
// Matches ZaloPay's default order lifetime; sent as expire_duration_seconds.
const ZALOPAY_CHECKOUT_TTL_MS = 15 * 60 * 1000;

export class ZalopayPaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly client: ZaloPay;
  private readonly callbackUrl: string;
  private readonly redirectUrl: string;

  constructor(private readonly config: ZalopayPaymentGatewayAdapterConfig) {
    this.client = new ZaloPay({
      appId: config.appId,
      key1: config.key1,
      key2: config.key2,
      lang: ZaloPayLocale.VI,
      testMode: true,
      enableLog: false
    });
    this.callbackUrl = new URL(ZALOPAY_CALLBACK_PATH, config.paymentPublicBaseUrl).toString();
    this.redirectUrl = new URL(ZALOPAY_CALLBACK_RETURN_PATH, config.paymentPublicBaseUrl).toString();
  }

  // app_trans_id must be yymmdd_ (Vietnam time) + reference with at most 40 characters,
  // so the UUID v7 reference drops its dashes (39 characters in total).
  createOrderReference(now: Date): ProviderOrderReference {
    return {
      providerOrderId: generateAppTransId(generateId().replaceAll('-', ''), now),
      expiresAt: new Date(now.getTime() + ZALOPAY_CHECKOUT_TTL_MS)
    };
  }

  async createCheckout(payment: PaymentCheckoutProps, clientIp: string): Promise<string> {
    void clientIp;
    if (payment.provider !== 'zalopay')
      throw new Error('ZaloPay adapter cannot create a checkout for another provider');
    if (!payment.expiresAt) throw new Error('ZaloPay payment expiry is required');

    let timeoutId: NodeJS.Timeout | undefined;
    let order: CreateOrderResponse;
    try {
      const sdkRequest = this.client.createOrder({
        appTransId: payment.providerOrderId,
        appUser: ZALOPAY_APP_USER,
        appTime: payment.createdAt.getTime(),
        amount: payment.amountVnd,
        description: `${payment.description} ${payment.providerOrderId}`,
        redirectUrl: this.redirectUrl,
        callbackUrl: this.callbackUrl,
        expireDurationSeconds: Math.round((payment.expiresAt.getTime() - payment.createdAt.getTime()) / 1000)
      });
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new PaymentCheckoutError(
              { kind: 'uncertain', reason: 'timeout' },
              'ZaloPay checkout request exceeded its 35 second deadline'
            )
          );
        }, ZALOPAY_GATEWAY_TIMEOUT_MS);
      });
      order = await Promise.race([sdkRequest, timeout]);
    } catch (error) {
      if (error instanceof PaymentCheckoutError) throw error;
      // fetch rejects with TypeError when the request never got a response.
      const reason = error instanceof TypeError ? 'network' : 'unclassified';
      throw new PaymentCheckoutError({ kind: 'uncertain', reason }, 'ZaloPay checkout result is uncertain');
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!order.isSuccess) throw this.toCheckoutError(order);
    if (order.app_trans_id !== payment.providerOrderId) {
      throw new PaymentCheckoutError(
        { kind: 'uncertain', reason: 'unclassified' },
        'ZaloPay order was created with an unexpected app_trans_id'
      );
    }
    return this.validateCheckoutUrl(order.order_url);
  }

  verifyNotification(payload: unknown): VerifiedNotification {
    const body = this.toCallbackBody(payload);
    let verified: ReturnType<typeof this.client.verifyIpnCall>;
    try {
      verified = this.client.verifyIpnCall(body);
    } catch {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    if (!verified.isVerified) throw new PaymentNotificationVerificationError('invalid_signature');
    if (Number(body.type) !== ZALOPAY_ORDER_CALLBACK_TYPE || !verified.isSuccess) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }
    if (String(verified.app_id) !== this.config.appId) {
      throw new PaymentNotificationVerificationError('merchant_mismatch');
    }

    const providerOrderId = this.requiredString(verified.app_trans_id);
    const transactionId = this.requiredTransactionId(verified.zp_trans_id);
    const amountVnd = Number(verified.amount);
    if (!Number.isSafeInteger(amountVnd) || amountVnd <= 0) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    return {
      provider: 'zalopay',
      providerOrderId,
      amountVnd,
      providerTransactionId: transactionId,
      resultCode: ZALOPAY_SUCCESS_RESULT_CODE,
      outcome: 'succeeded'
    };
  }

  private toCheckoutError(order: CreateOrderResponse): PaymentCheckoutError {
    const resultCode = `${order.return_code}:${order.sub_return_code}`;
    // FAIL means ZaloPay did not create the order, except a duplicate app_trans_id where an order may already exist.
    if (
      order.return_code === ZaloPayReturnCode.FAIL &&
      order.sub_return_code !== ZaloPaySubReturnCode.DUPLICATE_APP_TRANS_ID
    ) {
      return new PaymentCheckoutError(
        { kind: 'definitive_rejection', resultCode },
        `ZaloPay rejected the checkout (${resultCode})`
      );
    }
    return new PaymentCheckoutError(
      { kind: 'uncertain', reason: 'unclassified' },
      `ZaloPay checkout result is uncertain (${resultCode})`
    );
  }

  private toCallbackBody(payload: unknown): ZaloPayCallbackBody {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }
    const input = payload as Record<string, unknown>;
    const type = input.type;
    if (typeof type !== 'number' && typeof type !== 'string') {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    return {
      data: this.requiredString(input.data),
      mac: this.requiredString(input.mac),
      type
    };
  }

  private requiredString(value: unknown): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }
    return value;
  }

  private requiredTransactionId(value: unknown): string {
    if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
    if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) return value;
    throw new PaymentNotificationVerificationError('invalid_payload');
  }

  private validateCheckoutUrl(value: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new PaymentCheckoutError(
        { kind: 'uncertain', reason: 'unclassified' },
        'ZaloPay did not return a checkout URL'
      );
    }

    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(value);
    } catch {
      throw new PaymentCheckoutError(
        { kind: 'uncertain', reason: 'unclassified' },
        'ZaloPay returned an invalid checkout URL'
      );
    }
    if (checkoutUrl.protocol !== 'https:' || !checkoutUrl.hostname.endsWith(ZALOPAY_CHECKOUT_HOST_SUFFIX)) {
      throw new PaymentCheckoutError(
        { kind: 'uncertain', reason: 'unclassified' },
        'ZaloPay returned a checkout URL outside its domain'
      );
    }
    return checkoutUrl.toString();
  }
}
