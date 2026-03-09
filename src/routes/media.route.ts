import mediaController from '@/controllers/media.controller';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.post('/upload-image', asyncHandler(mediaController.uploadImage.bind(mediaController)));

export default router;
