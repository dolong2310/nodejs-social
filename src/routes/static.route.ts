import mediaController from '@/controllers/media.controller';
import express from 'express';

const router = express.Router();

router.get('/images/:filename', mediaController.getStaticImage.bind(mediaController));
// router.get('/videos/:filename', mediaController.getStaticVideo.bind(mediaController));
router.get('/videos-stream/:filename', mediaController.getStaticVideoStream.bind(mediaController));
router.get('/videos-hls/:id/master.m3u8', mediaController.getStaticVideoHLSMaster.bind(mediaController));
router.get('/videos-hls/:id/:version/:segment', mediaController.getStaticVideoHLSSegment.bind(mediaController));

export default router;
