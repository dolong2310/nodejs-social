import { envConfig } from '@/bootstrap/config/env.config';
import type { MomoPaymentGatewayAdapterConfig } from '@/modules/payment/infrastructure/gateways/momo-payment-gateway.adapter';
import type { VnpayPaymentGatewayAdapterConfig } from '@/modules/payment/infrastructure/gateways/vnpay-payment-gateway.adapter';

export interface PaymentEnvironment {
  VNPAY_TMN_CODE: string;
  VNPAY_SECURE_SECRET: string;
  VNPAY_HOST: string;
  MOMO_PARTNER_CODE: string;
  MOMO_ACCESS_KEY: string;
  MOMO_SECRET_KEY: string;
  MOMO_STORE_ID: string;
  MOMO_STORE_NAME: string;
  PAYMENT_PUBLIC_BASE_URL: string;
}

export interface PaymentConfig {
  vnpay: Omit<VnpayPaymentGatewayAdapterConfig, 'paymentPublicBaseUrl'>;
  momo: Omit<MomoPaymentGatewayAdapterConfig, 'paymentPublicBaseUrl'>;
  paymentPublicBaseUrl: string;
}

const REQUIRED_PAYMENT_KEYS: (keyof PaymentEnvironment)[] = [
  'VNPAY_TMN_CODE',
  'VNPAY_SECURE_SECRET',
  'VNPAY_HOST',
  'MOMO_PARTNER_CODE',
  'MOMO_ACCESS_KEY',
  'MOMO_SECRET_KEY',
  'MOMO_STORE_ID',
  'MOMO_STORE_NAME',
  'PAYMENT_PUBLIC_BASE_URL'
];

export function createPaymentConfig(values: PaymentEnvironment): PaymentConfig {
  for (const key of REQUIRED_PAYMENT_KEYS) {
    if (typeof values[key] !== 'string' || values[key].trim() === '') {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }

  const vnpayHost = parseUrl(values.VNPAY_HOST, 'VNPAY_HOST');
  if (
    vnpayHost.protocol !== 'https:' ||
    vnpayHost.hostname !== 'sandbox.vnpayment.vn' ||
    vnpayHost.port !== '' ||
    !['', '/'].includes(vnpayHost.pathname) ||
    vnpayHost.username !== '' ||
    vnpayHost.password !== '' ||
    vnpayHost.search !== '' ||
    vnpayHost.hash !== ''
  ) {
    throw new Error('VNPAY_HOST must point to https://sandbox.vnpayment.vn');
  }

  const publicBaseUrl = parseUrl(values.PAYMENT_PUBLIC_BASE_URL, 'PAYMENT_PUBLIC_BASE_URL');
  if (publicBaseUrl.protocol !== 'https:') {
    throw new Error('PAYMENT_PUBLIC_BASE_URL must use HTTPS');
  }
  if (
    publicBaseUrl.username !== '' ||
    publicBaseUrl.password !== '' ||
    publicBaseUrl.pathname !== '/' ||
    publicBaseUrl.search !== '' ||
    publicBaseUrl.hash !== ''
  ) {
    throw new Error('PAYMENT_PUBLIC_BASE_URL must be an HTTPS origin without a path, query, or fragment');
  }

  return {
    vnpay: {
      tmnCode: values.VNPAY_TMN_CODE,
      secureSecret: values.VNPAY_SECURE_SECRET,
      vnpayHost: vnpayHost.origin
    },
    momo: {
      partnerCode: values.MOMO_PARTNER_CODE,
      accessKey: values.MOMO_ACCESS_KEY,
      secretKey: values.MOMO_SECRET_KEY,
      storeId: values.MOMO_STORE_ID,
      storeName: values.MOMO_STORE_NAME
    },
    paymentPublicBaseUrl: publicBaseUrl.origin
  };
}

function parseUrl(value: string, environmentKey: string): URL {
  try {
    return new URL(value);
  } catch {
    throw new Error(`${environmentKey} must be a valid URL`);
  }
}

export const paymentConfig = createPaymentConfig(envConfig);
