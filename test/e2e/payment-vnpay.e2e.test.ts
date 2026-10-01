import express, { type NextFunction, type Request } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type {
  PaymentProvider,
  PaymentFullProps,
  PaymentProps,
  VerifiedNotification
} from '@/modules/payment/domain/entities/payment.types';
import type {
  ApplyVerifiedOutcomeResult,
  PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';
import { installE2eEnv } from './support/e2e-env';

installE2eEnv();
Object.assign(process.env, {
  SYSTEM_HEALTH_MONITOR_ENABLED: '0',
  SYSTEM_HEALTH_CRON: '*/5 * * * *',
  SYSTEM_HEALTH_TIMEZONE: 'UTC',
  SYSTEM_HEALTH_DISK_PATH: '/tmp',
  SYSTEM_HEALTH_CPU_WARN: '75',
  SYSTEM_HEALTH_CPU_CRITICAL: '90',
  SYSTEM_HEALTH_RAM_WARN: '75',
  SYSTEM_HEALTH_RAM_CRITICAL: '90',
  SYSTEM_HEALTH_DISK_WARN: '75',
  SYSTEM_HEALTH_DISK_CRITICAL: '90',
  SYSTEM_HEALTH_PROCESS_MEMORY_WARN_MB: '512',
  SYSTEM_HEALTH_PROCESS_MEMORY_CRITICAL_MB: '1024',
  SYSTEM_HEALTH_ALERT_COOLDOWN_SECONDS: '300',
  SYSTEM_HEALTH_ADMIN_EMAILS: 'test@example.com'
});

const [
  { PaymentRoute },
  { PaymentCallbackRoute },
  { PaymentController },
  { PaymentCallbackController },
  { PaymentsPipe },
  { VnpayPaymentGatewayAdapter },
  { CreatePaymentUseCase },
  { GetPaymentUseCase },
  { HandlePaymentNotificationUseCase },
  { LoggingInterceptor },
  { TransformResponseInterceptor },
  { TimeoutInterceptor },
  { HttpExceptionFilter },
  { UnauthorizedException },
  { VNPay }
] = await Promise.all([
  import('@/presentation/http/express/v1/routes/payment.route'),
  import('@/presentation/http/express/v1/routes/payment-callback.route'),
  import('@/presentation/http/express/v1/controllers/payment.controller'),
  import('@/presentation/http/express/v1/controllers/payment-callback.controller'),
  import('@/presentation/http/express/v1/pipes/payment.pipe'),
  import('@/modules/payment/infrastructure/gateways/vnpay-payment-gateway.adapter'),
  import('@/modules/payment/application/use-cases/create-payment/create-payment.usecase'),
  import('@/modules/payment/application/use-cases/get-payment/get-payment.usecase'),
  import('@/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.usecase'),
  import('@/presentation/http/express/interceptors/logging.interceptor'),
  import('@/presentation/http/express/interceptors/transform-response.interceptor'),
  import('@/presentation/http/express/interceptors/timeout.interceptor'),
  import('@/presentation/http/express/filters/exception.filter'),
  import('@/presentation/http/express/responses/error.response'),
  import('@longdoo/node-payment-gateway')
]);

const merchantCode = 'TESTTMNCODE';
const secureSecret = '0123456789ABCDEF0123456789ABCDEF';
const tokenSecret = 'payment-e2e-test-secret';

describe('VNPay payment HTTP e2e', () => {
  const fixtures: PaymentFixture[] = [];

  afterEach(() => {
    fixtures.length = 0;
  });

  it('creates an authenticated order payment and returns it only to its owner', async () => {
    const fixture = createFixture();
    fixtures.push(fixture);

    const created = await request(fixture.app)
      .post('/api/v1/payments')
      .set('Authorization', bearer('user-1'))
      .set('Idempotency-Key', 'create-vnpay-1')
      .send({
        provider: 'vnpay',
        sourceReference: 'order_client_vnpay_1',
        description: 'Thanh toan don hang VNPay 1',
        amountVnd: 150_000
      })
      .expect(201);

    expect(created.body.data).toMatchObject({
      sourceReference: 'order_client_vnpay_1',
      description: 'Thanh toan don hang VNPay 1',
      amountVnd: 150_000,
      currency: 'VND',
      provider: 'vnpay',
      status: 'pending'
    });
    expect(created.body.data.paymentId).toEqual(expect.any(String));
    expect(created.body.data.checkoutUrl).toContain('sandbox.vnpayment.vn');

    const paymentId = created.body.data.paymentId as string;
    const read = await request(fixture.app)
      .get(`/api/v1/payments/${paymentId}`)
      .set('Authorization', bearer('user-1'))
      .expect(200);
    expect(read.body.data).toMatchObject({ paymentId, status: 'pending', amountVnd: 150_000 });

    await request(fixture.app).get(`/api/v1/payments/${paymentId}`).expect(401);
    await request(fixture.app)
      .get(`/api/v1/payments/${paymentId}`)
      .set('Authorization', bearer('another-user'))
      .expect(404);
  });

  it('requires an idempotency key and valid client-supplied payment details', async () => {
    const fixture = createFixture();
    fixtures.push(fixture);

    await request(fixture.app)
      .post('/api/v1/payments')
      .set('Authorization', bearer('user-1'))
      .send({
        provider: 'vnpay',
        sourceReference: 'order_without_key',
        description: 'Order without idempotency key',
        amountVnd: 10_000
      })
      .expect(422);

    await request(fixture.app)
      .post('/api/v1/payments')
      .set('Authorization', bearer('user-1'))
      .set('Idempotency-Key', 'unsupported-provider-1')
      .send({
        provider: 'bank-transfer',
        sourceReference: 'order_unsupported_provider',
        description: 'Order with unsupported provider',
        amountVnd: 10_000
      })
      .expect(422);

    await request(fixture.app)
      .post('/api/v1/payments')
      .set('Authorization', bearer('user-1'))
      .set('Idempotency-Key', 'missing-payment-details-1')
      .send({ provider: 'vnpay' })
      .expect(422);

    await request(fixture.app)
      .post('/api/v1/payments')
      .set('Authorization', bearer('user-1'))
      .set('Idempotency-Key', 'invalid-payment-amount-1')
      .send({
        provider: 'vnpay',
        sourceReference: 'order_invalid_amount',
        description: 'Order with invalid amount',
        amountVnd: 9_999
      })
      .expect(422);
  });

  it('maps verified IPN outcomes to the exact VNPay response protocol', async () => {
    const fixture = createFixture();
    fixtures.push(fixture);

    const successPayment = await fixture.createPayment('success-1');
    const signedSuccess = signIpn(successPayment);
    await request(fixture.app)
      .get('/api/v1/payments/callbacks/vnpay/ipn')
      .query(signedSuccess)
      .expect(200, { RspCode: '00', Message: 'Success' });
    await request(fixture.app)
      .get('/api/v1/payments/callbacks/vnpay/ipn')
      .query(signedSuccess)
      .expect(200, { RspCode: '02', Message: 'Order already confirmed' });

    await request(fixture.app)
      .get('/api/v1/payments/callbacks/vnpay/ipn')
      .query(signIpn(successPayment, { vnp_TxnRef: 'po_unknown' }))
      .expect(200, { RspCode: '01', Message: 'Order not found' });

    const mismatchPayment = await fixture.createPayment('amount-mismatch-1');
    await request(fixture.app)
      .get('/api/v1/payments/callbacks/vnpay/ipn')
      .query(signIpn(mismatchPayment, { vnp_Amount: '1000100' }))
      .expect(200, { RspCode: '04', Message: 'Invalid amount' });

    await request(fixture.app)
      .get('/api/v1/payments/callbacks/vnpay/ipn')
      .query({ ...signedSuccess, vnp_Amount: '999999' })
      .expect(200, { RspCode: '97', Message: 'Invalid signature' });

    await request(fixture.app)
      .get('/api/v1/payments/callbacks/vnpay/ipn')
      .query(signIpn(successPayment, { vnp_TmnCode: 'OTHERMERCHANT' }))
      .expect(200, { RspCode: '97', Message: 'Invalid signature' });

    const conflictPayment = await fixture.createPayment('state-conflict-1');
    fixture.repository.returnStateConflict = true;
    await request(fixture.app)
      .get('/api/v1/payments/callbacks/vnpay/ipn')
      .query(signIpn(conflictPayment))
      .expect(200, { RspCode: '99', Message: 'Unknown error' });
    fixture.repository.returnStateConflict = false;
    fixture.repository.failApply = true;
    await request(fixture.app)
      .get('/api/v1/payments/callbacks/vnpay/ipn')
      .query(signIpn(conflictPayment, { vnp_TxnRef: 'po_storage_failure' }))
      .expect(200, { RspCode: '99', Message: 'Unknown error' });
  });

  it('does not return an expired checkout URL as available', async () => {
    const fixture = createFixture();
    fixtures.push(fixture);
    const payment = await fixture.createPayment('expired-checkout-1');
    fixture.expirePayment(payment.id);

    const response = await request(fixture.app)
      .get(`/api/v1/payments/${payment.id}`)
      .set('Authorization', bearer('user-1'))
      .expect(200);

    expect(response.body.data.status).toBe('pending');
    expect(response.body.data.checkoutUrl).toBeNull();
  });

  it('keeps the VNPay return handler read-only', async () => {
    const fixture = createFixture();
    fixtures.push(fixture);
    const payment = await fixture.createPayment('return-read-only-1');

    await request(fixture.app).get('/api/v1/payments/callbacks/vnpay/return').query(signIpn(payment)).expect(200);

    expect((await fixture.repository.findPaymentById(payment.id))?.getProps().status).toBe('pending');
  });
});

interface PaymentFixture {
  app: express.Express;
  repository: InMemoryPaymentRepository;
  createPayment(idempotencyKey: string): Promise<PaymentFullProps>;
  expirePayment(paymentId: string): void;
}

function createFixture(): PaymentFixture {
  const repository = new InMemoryPaymentRepository();
  const vnpay = new VnpayPaymentGatewayAdapter({
    tmnCode: merchantCode,
    secureSecret,
    vnpayHost: 'https://sandbox.vnpayment.vn',
    paymentPublicBaseUrl: 'https://social.test'
  });
  const momo = {
    createCheckout: async () => 'https://momo.test/unused',
    verifyNotification: () => {
      throw new Error('MoMo is not used in VNPay tests');
    }
  };
  const gateways = { vnpay, momo };
  const createPaymentUseCase = new CreatePaymentUseCase(repository, gateways);
  const getPaymentUseCase = new GetPaymentUseCase(repository);
  const notificationUseCase = new HandlePaymentNotificationUseCase(repository, gateways);
  const paymentController = new PaymentController(createPaymentUseCase, getPaymentUseCase);
  const callbackController = new PaymentCallbackController(notificationUseCase);
  const logger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    debug: () => undefined,
    child: () => logger
  };
  const authGuard = {
    canActivate: async (req: Request) => {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      if (!token) throw new UnauthorizedException();
      req.tokenPayload = jwt.verify(token, tokenSecret) as Request['tokenPayload'];
      return true;
    }
  };
  const activeUserGuard = { canActivate: async () => true };
  const throttlerGuard = { handler: () => (_req: Request, _res: express.Response, next: NextFunction) => next() };
  const paymentRoute = new PaymentRoute(
    paymentController,
    new PaymentsPipe(),
    authGuard as never,
    activeUserGuard as never,
    throttlerGuard as never,
    new LoggingInterceptor(logger),
    new TransformResponseInterceptor(),
    new TimeoutInterceptor({ timeoutMs: 45_000 })
  );
  const callbackRoute = new PaymentCallbackRoute(callbackController);

  const app = express();
  app.use(express.json());
  app.use(`/api/${paymentRoute.getVersion()}/${paymentRoute.getPath()}`, paymentRoute.getRouter());
  app.use(`/api/${callbackRoute.getVersion()}/${callbackRoute.getPath()}`, callbackRoute.getRouter());
  app.use(HttpExceptionFilter.catch);

  return {
    app,
    repository,
    async createPayment(idempotencyKey: string) {
      const result = await createPaymentUseCase.execute({
        userId: 'user-1',
        provider: 'vnpay',
        sourceReference: `order_${idempotencyKey}`,
        description: `Order ${idempotencyKey}`,
        amountVnd: 10_000,
        idempotencyKey,
        clientIp: '203.0.113.10'
      });
      const payment = await repository.findPaymentById(result.id);
      if (!payment) throw new Error('created payment not found');
      return payment.toObject<PaymentFullProps>();
    },
    expirePayment(paymentId) {
      repository.expireCheckout(paymentId);
    }
  };
}

function bearer(userId: string): string {
  return `Bearer ${jwt.sign({ userId, roleId: 'role-payment-test' }, tokenSecret)}`;
}

function signIpn(payment: PaymentFullProps, overrides: Record<string, string> = {}): Record<string, string> {
  const payload: Record<string, string> = {
    vnp_Amount: String(payment.amountVnd * 100),
    vnp_BankCode: 'NCB',
    vnp_BankTranNo: 'NCB202609250001',
    vnp_CardType: 'ATM',
    vnp_OrderInfo: `Order payment ${payment.providerOrderId}`,
    vnp_PayDate: '20260925070000',
    vnp_ResponseCode: '00',
    vnp_TmnCode: merchantCode,
    vnp_TransactionNo: '123456789012345',
    vnp_TransactionStatus: '00',
    vnp_TxnRef: payment.providerOrderId,
    ...overrides
  };
  const data = VNPay.buildPaymentUrlSearchParams(payload).toString();
  payload.vnp_SecureHash = VNPay.calculateSecureHash({
    secureSecret,
    data,
    hashAlgorithm: VNPay.HashAlgorithm.SHA512,
    bufferEncode: 'utf-8'
  });
  return payload;
}

class InMemoryPaymentRepository implements PaymentRepositoryPort {
  private readonly records = new Map<string, PaymentFullProps>();
  failApply = false;
  returnStateConflict = false;

  async insertOrFindByIdempotency(payment: PaymentEntity): Promise<{ payment: PaymentEntity; inserted: boolean }> {
    const record = payment.toObject<PaymentFullProps>();
    const existing = [...this.records.values()].find(
      (candidate) => candidate.userId === record.userId && candidate.idempotencyKey === record.idempotencyKey
    );
    if (existing) return { payment: this.toEntity(existing), inserted: false };
    const stored = { ...record };
    this.records.set(stored.id, stored);
    return { payment: this.toEntity(stored), inserted: true };
  }

  async findPaymentById(id: string): Promise<PaymentEntity | null> {
    const payment = this.records.get(id);
    return payment ? this.toEntity(payment) : null;
  }

  expireCheckout(id: string): void {
    const record = this.requireRecord(id);
    this.records.set(id, { ...record, expiresAt: new Date(Date.now() - 1000) });
  }

  async findPaymentByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentEntity | null> {
    const payment = [...this.records.values()].find(
      (record) => record.provider === provider && record.providerOrderId === orderId
    );
    return payment ? this.toEntity(payment) : null;
  }

  async attachCheckoutUrlIfAbsent(id: string, url: string): Promise<PaymentEntity> {
    const record = this.requireRecord(id);
    if (!record.checkoutUrl) {
      const updated: PaymentFullProps = {
        ...record,
        checkoutUrl: url,
        status: record.status === 'creating' ? 'pending' : record.status
      };
      this.records.set(id, updated);
      return this.toEntity(updated);
    }
    return this.toEntity(record);
  }

  async setUnknownIfCreating(id: string): Promise<PaymentEntity> {
    const record = this.requireRecord(id);
    if (record.status !== 'creating') return this.toEntity(record);
    const updated: PaymentFullProps = { ...record, status: 'unknown' };
    this.records.set(id, updated);
    return this.toEntity(updated);
  }

  async setCreateFailedIfCreating(id: string, resultCode: string): Promise<PaymentEntity> {
    const record = this.requireRecord(id);
    if (record.status !== 'creating') return this.toEntity(record);
    const updated: PaymentFullProps = { ...record, status: 'create_failed', providerResultCode: resultCode };
    this.records.set(id, updated);
    return this.toEntity(updated);
  }

  async applyVerifiedOutcome(input: VerifiedNotification): Promise<ApplyVerifiedOutcomeResult> {
    if (this.failApply) throw new Error('database unavailable');
    if (this.returnStateConflict) return 'state_conflict';
    const record = await this.findPaymentByProviderOrderId(input.provider, input.providerOrderId);
    if (!record) return 'not_found';
    const props = record.getProps();
    if (props.amountVnd !== input.amountVnd) return 'amount_mismatch';
    if (props.status === input.outcome && props.providerTransactionId === input.providerTransactionId)
      return 'duplicate';
    if (['succeeded', 'failed', 'cancelled'].includes(props.status)) return 'state_conflict';
    const updated: PaymentFullProps = {
      ...record.toObject<PaymentFullProps>(),
      status: input.outcome,
      providerTransactionId: input.providerTransactionId,
      providerResultCode: input.resultCode
    };
    this.records.set(record.id.toString(), updated);
    return 'applied';
  }

  private requireRecord(id: string): PaymentFullProps {
    const record = this.records.get(id);
    if (!record) throw new Error(`Missing test payment ${id}`);
    return record;
  }

  private toEntity(payment: PaymentFullProps): PaymentEntity {
    const { id, createdAt, createdById, updatedAt, updatedById, deletedAt, deletedById, ...props } = payment;
    return new PaymentEntity({
      id: new UniqueEntityID(id),
      createdAt,
      createdById,
      updatedAt,
      updatedById,
      deletedAt,
      deletedById,
      props: props as PaymentProps
    });
  }
}
