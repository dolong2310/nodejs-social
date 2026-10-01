import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import type { HandlePaymentNotificationPort } from '@/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import type { Request, Response } from 'express';

export interface IPaymentCallbackController {
  vnpayIpn(req: Request, res: Response): Promise<void>;
  vnpayReturn(req: Request, res: Response): void;
  momoIpn(req: Request, res: Response): Promise<void>;
  momoReturn(req: Request, res: Response): void;
}

export class PaymentCallbackController {
  constructor(private readonly handlePaymentNotification: HandlePaymentNotificationPort) {}

  @AutoBind()
  async vnpayIpn(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.handlePaymentNotification.execute({ provider: 'vnpay', payload: req.query });
      const response = toVnpayResponse(result);
      res.status(200).json(response);
    } catch (error) {
      if (error instanceof PaymentNotificationVerificationError) {
        res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
        return;
      }

      // VNPay retries unless it receives its protocol response; never acknowledge an unpersisted notification.
      res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  @AutoBind()
  vnpayReturn(_req: Request, res: Response): void {
    res.status(200).send('Payment result received. Please check the payment status in the application.');
  }

  @AutoBind()
  async momoIpn(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.handlePaymentNotification.execute({ provider: 'momo', payload: req.body });
      if (result === 'applied' || result === 'duplicate') {
        res.status(204).end();
        return;
      }

      if (result === 'state_conflict') {
        res.status(409).end();
        return;
      }

      res.status(400).end();
    } catch (error) {
      if (error instanceof PaymentNotificationVerificationError) {
        res.status(400).end();
        return;
      }

      res.status(500).end();
    }
  }

  @AutoBind()
  momoReturn(_req: Request, res: Response): void {
    res.status(200).send('Payment result received. Please check the payment status in the application.');
  }
}

function toVnpayResponse(
  result: 'applied' | 'duplicate' | 'not_found' | 'amount_mismatch' | 'reference_mismatch' | 'state_conflict'
): { RspCode: string; Message: string } {
  switch (result) {
    case 'applied':
      return { RspCode: '00', Message: 'Success' };
    case 'duplicate':
      return { RspCode: '02', Message: 'Order already confirmed' };
    case 'not_found':
      return { RspCode: '01', Message: 'Order not found' };
    case 'amount_mismatch':
      return { RspCode: '04', Message: 'Invalid amount' };
    case 'reference_mismatch':
      return { RspCode: '97', Message: 'Invalid signature' };
    case 'state_conflict':
      return { RspCode: '99', Message: 'Unknown error' };
  }
}
