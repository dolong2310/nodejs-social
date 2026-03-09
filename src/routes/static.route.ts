import mediaController from '@/controllers/media.controller';
import express from 'express';

const router = express.Router();

router.get('/:filename', mediaController.getStaticImage.bind(mediaController));

export default router;
