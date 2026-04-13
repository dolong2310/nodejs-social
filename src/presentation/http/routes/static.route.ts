import { IMediaController } from '@/presentation/http/controllers/media.controller';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';

export class StaticRoute extends BaseRoute {
  constructor(private readonly mediaController: IMediaController) {
    super('/static');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { getStaticImage, getStaticVideoStream, getStaticVideoHLSMaster, getStaticVideoHLSSegment } =
      this.mediaController;

    this.router.get('/images/:filename', appLimiter, getStaticImage);
    // this.router.get('/videos/:filename', getStaticVideo);
    this.router.get('/videos-stream/:filename', appLimiter, getStaticVideoStream);
    this.router.get('/videos-hls/:id/master.m3u8', appLimiter, getStaticVideoHLSMaster);
    this.router.get('/videos-hls/:id/:version/:segment', appLimiter, getStaticVideoHLSSegment);
  }
}
