import { IMediaController } from '@/presentation/http/express/v1/controllers/media.controller';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class StaticRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'static';

  constructor(private readonly mediaController: IMediaController) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getStaticImage, getStaticVideoStream, getStaticVideoStreamMaster, getStaticVideoStreamSegment } =
      this.mediaController;

    this.router.get('/images/:filename', appLimiter, getStaticImage);
    // this.router.get('/videos/:filename', getStaticVideo);
    this.router.get('/videos-stream/:filename', appLimiter, getStaticVideoStream);
    this.router.get('/videos-stream/:id/master.m3u8', appLimiter, getStaticVideoStreamMaster);
    this.router.get('/videos-stream/:id/:version/:segment', appLimiter, getStaticVideoStreamSegment);
  }
}
