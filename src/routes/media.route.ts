import mediaController from '@/controllers/media.controller';
import { checkUserVerified, validateAccessToken } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.post('/upload-image', validateAccessToken, checkUserVerified, asyncHandler(mediaController.uploadImage.bind(mediaController)));
router.post('/upload-video', validateAccessToken, checkUserVerified, asyncHandler(mediaController.uploadVideo.bind(mediaController)));
router.post('/upload-video-hls', validateAccessToken, checkUserVerified, asyncHandler(mediaController.uploadVideoHLS.bind(mediaController)));
router.get('/video-status/:id', validateAccessToken, checkUserVerified, asyncHandler(mediaController.getVideoStatus.bind(mediaController)));

export default router;
