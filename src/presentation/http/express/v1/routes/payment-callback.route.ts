import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
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
    const configs: RouterConfig[] = [
      {
        path: '/vnpay/ipn',
        method: 'get',
        controller: (req, res) => {
          void this.paymentCallbackController.vnpayIpn(req, res);
        }
      },
      {
        path: '/vnpay/return',
        method: 'get',
        controller: (req, res) => {
          this.paymentCallbackController.vnpayReturn(req, res);
        }
      },
      {
        path: '/momo/ipn',
        method: 'post',
        controller: (req, res) => {
          void this.paymentCallbackController.momoIpn(req, res);
        }
      },
      {
        path: '/momo/return',
        method: 'get',
        controller: (req, res) => {
          this.paymentCallbackController.momoReturn(req, res);
        }
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
