import type { CreatePaymentPort } from '@/modules/payment/application/use-cases/create-payment/create-payment.port';
import type { GetPaymentPort } from '@/modules/payment/application/use-cases/get-payment/get-payment.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created, type SuccessResponse } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type {
  CreatePaymentBodySchema,
  PaymentIdParamsSchema
} from '@/presentation/http/express/v1/schemas/payment/payment.request.schema';
import type { PaymentSafeProps } from '@/modules/payment/domain/entities/payment.types';

type CreatePaymentRequest = ValidatedRequest<{ body: typeof CreatePaymentBodySchema }>;
type GetPaymentRequest = ValidatedRequest<{ params: typeof PaymentIdParamsSchema }>;

/** Returns `PaymentSafeProps`; the route's `PaymentResponseSchema` maps it to the public shape. */
export interface IPaymentController {
  create(req: CreatePaymentRequest): Promise<SuccessResponse<PaymentSafeProps>>;
  getById(req: GetPaymentRequest): Promise<SuccessResponse<PaymentSafeProps>>;
}

@AutoBind()
export class PaymentController extends BaseController implements IPaymentController {
  constructor(
    private readonly createPaymentUC: CreatePaymentPort,
    private readonly getPaymentUC: GetPaymentPort
  ) {
    super();
  }

  async create(req: CreatePaymentRequest) {
    const idempotencyKey = req.get('Idempotency-Key')?.trim();
    const payment = await this.createPaymentUC.execute({
      userId: this.getUserId(req),
      provider: req.body.provider,
      sourceReference: req.body.sourceReference,
      description: req.body.description,
      amountVnd: req.body.amountVnd,
      idempotencyKey: idempotencyKey ?? '',
      clientIp: req.ip || '127.0.0.1'
    });

    return this.response({
      instance: Created,
      data: payment,
      message: 'Payment created'
    });
  }

  async getById(req: GetPaymentRequest) {
    const payment = await this.getPaymentUC.execute({
      userId: this.getUserId(req),
      paymentId: req.params.paymentId
    });
    return this.response({
      data: payment,
      message: 'Payment loaded'
    });
  }
}
