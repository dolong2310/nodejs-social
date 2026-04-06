import { BaseRoute } from '@/modules/base/base.route';
import { MediaController } from '@/modules/media/media.controller';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';

class StaticRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { getStaticImage, getStaticVideoStream, getStaticVideoHLSMaster, getStaticVideoHLSSegment } =
      this.container.get(MediaController);

    this.router.get('/images/:filename', appLimiter, getStaticImage);
    // this.router.get('/videos/:filename', getStaticVideo);
    this.router.get('/videos-stream/:filename', appLimiter, getStaticVideoStream);
    this.router.get('/videos-hls/:id/master.m3u8', appLimiter, getStaticVideoHLSMaster);
    this.router.get('/videos-hls/:id/:version/:segment', appLimiter, getStaticVideoHLSSegment);
  }
}

export function staticRouter() {
  return new StaticRoute().getRouter();
}
