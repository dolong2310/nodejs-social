import { CreatePaymentPort } from '@/modules/payment/application/use-cases/create-payment/create-payment.port';
import { GetPaymentPort } from '@/modules/payment/application/use-cases/get-payment/get-payment.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import {
  CreatePaymentBodyDTO,
  PaymentIdParamsDTO
} from '@/presentation/http/express/v1/dtos/payment/payment.request.dto';
import { PaymentResponseDTO } from '@/presentation/http/express/v1/dtos/payment/payment.response.dto';
import { Created, SuccessResponse } from '@/presentation/http/express/responses/success.response';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPaymentController {
  create(
    req: ExpressRequest<ParamsDictionary, object, CreatePaymentBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<PaymentResponseDTO>>;
  getById(
    req: ExpressRequest<PaymentIdParamsDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<PaymentResponseDTO>>;
}

export class PaymentController extends BaseController implements IPaymentController {
  constructor(
    private readonly createPaymentUC: CreatePaymentPort,
    private readonly getPaymentUC: GetPaymentPort
  ) {
    super();
  }

  @AutoBind()
  async create(req: ExpressRequest<ParamsDictionary, object, CreatePaymentBodyDTO>) {
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
      data: new PaymentResponseDTO(payment),
      message: 'Payment created'
    });
  }

  @AutoBind()
  async getById(req: ExpressRequest<PaymentIdParamsDTO>) {
    const payment = await this.getPaymentUC.execute({
      userId: this.getUserId(req),
      paymentId: req.params.paymentId
    });
    return this.response({
      data: new PaymentResponseDTO(payment),
      message: 'Payment loaded'
    });
  }
}
