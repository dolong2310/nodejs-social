import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { IPaymentCallbackController } from '@/presentation/http/express/v1/controllers/payment-callback.controller';

export class PaymentCallbackRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'payments/callbacks';

  constructor(private readonly paymentCallbackController: IPaymentCallbackController) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    // Provider callbacks use their own protocol response and must bypass the shared API response pipeline.
    this.router.get('/vnpay/ipn', (req, res) => {
      void this.paymentCallbackController.vnpayIpn(req, res);
    });
    this.router.get('/vnpay/return', (req, res) => {
      this.paymentCallbackController.vnpayReturn(req, res);
    });
  }
}
