/*
 * This file defines the static routes for getting static images, videos, and video streams.
 */

import { BaseRoute, IMediaController } from '@/modules';
import { appLimiter } from '@/shared';

class StaticRoute extends BaseRoute {
  private mediaController!: IMediaController;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.mediaController = this.container.getMediaController();

    this.router.get('/images/:filename', appLimiter, this.mediaController.getStaticImage);
    // this.router.get('/videos/:filename', this.mediaController.getStaticVideo);
    this.router.get('/videos-stream/:filename', appLimiter, this.mediaController.getStaticVideoStream);
    this.router.get('/videos-hls/:id/master.m3u8', appLimiter, this.mediaController.getStaticVideoHLSMaster);
    this.router.get('/videos-hls/:id/:version/:segment', appLimiter, this.mediaController.getStaticVideoHLSSegment);
  }
}

export function staticRouter() {
  return new StaticRoute().getRouter();
}
