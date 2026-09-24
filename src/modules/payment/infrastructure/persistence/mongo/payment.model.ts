import type { Document } from 'mongodb';

export interface PaymentModel extends Document {
  _id: string;
  user_id: string;
  source_type: 'example';
  source_reference: string;
  description: string;
  amount_vnd: number;
  currency: 'VND';
  provider: 'vnpay' | 'momo';
  provider_order_id: string;
  provider_request_id: string;
  idempotency_key: string;
  request_fingerprint: string;
  status: string;
  checkout_url: string | null;
  expires_at: Date | null;
  provider_transaction_id: string | null;
  provider_result_code: string | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}
