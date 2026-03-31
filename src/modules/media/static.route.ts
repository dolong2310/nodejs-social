/*
 * This file defines the static routes for getting static images, videos, and video streams.
 */

import { BaseRoute, MediaController } from '@/modules';
import { appLimiter } from '@/shared';

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
