import { CreateExamplePaymentPort } from '@/modules/payment/application/use-cases/create-example-payment/create-example-payment.port';
import { GetPaymentPort } from '@/modules/payment/application/use-cases/get-payment/get-payment.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import {
  CreateExamplePaymentBodyDTO,
  PaymentIdParams
} from '@/presentation/http/express/v1/dtos/payment/payment.request.dto';
import { PaymentResponseDTO } from '@/presentation/http/express/v1/dtos/payment/payment.response.dto';
import { Created } from '@/presentation/http/express/responses/success.response';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPaymentController {
  createExample(
    req: ExpressRequest<ParamsDictionary, object, CreateExamplePaymentBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  getById(req: ExpressRequest<PaymentIdParams>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
}

export class PaymentController extends BaseController implements IPaymentController {
  constructor(
    private readonly createExamplePayment: CreateExamplePaymentPort,
    private readonly getPayment: GetPaymentPort
  ) {
    super();
  }

  @AutoBind()
  async createExample(req: ExpressRequest<ParamsDictionary, object, CreateExamplePaymentBodyDTO>) {
    const idempotencyKey = req.get('Idempotency-Key')?.trim();
    const payment = await this.createExamplePayment.execute({
      userId: this.getUserId(req),
      provider: req.body.provider,
      idempotencyKey: idempotencyKey ?? '',
      clientIp: req.ip || '127.0.0.1'
    });

    return this.response({
      instance: Created,
      data: new PaymentResponseDTO(payment),
      message: 'Payment example created'
    });
  }

  @AutoBind()
  async getById(req: ExpressRequest<PaymentIdParams>) {
    const payment = await this.getPayment.execute({
      userId: this.getUserId(req),
      paymentId: req.params.paymentId
    });
    return this.response({ data: new PaymentResponseDTO(payment), message: 'Payment loaded' });
  }
}
