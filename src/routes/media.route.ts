import mediaController from '@/controllers/media.controller';
import { validateAccessToken } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.post('/upload-image', validateAccessToken, asyncHandler(mediaController.uploadImage.bind(mediaController)));
router.post('/upload-video', validateAccessToken, asyncHandler(mediaController.uploadVideo.bind(mediaController)));

export default router;
