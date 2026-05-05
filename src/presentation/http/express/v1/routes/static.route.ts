import { IMediaController } from '@/presentation/http/express/v1/controllers/media.controller';
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

    const throttler = this.throttlerGuard();

    this.router.get('/images/:filename', throttler, getStaticImage);
    // this.router.get('/videos/:filename', getStaticVideo);
    this.router.get('/videos-stream/:filename', throttler, getStaticVideoStream);
    this.router.get('/videos-stream/:id/master.m3u8', throttler, getStaticVideoStreamMaster);
    this.router.get('/videos-stream/:id/:version/:segment', throttler, getStaticVideoStreamSegment);
  }
}
