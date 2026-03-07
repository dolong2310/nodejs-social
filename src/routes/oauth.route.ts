import oauthController from '@/controllers/oauth.controller';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.get('/google', asyncHandler(oauthController.googleLogin.bind(oauthController)));

export default router;
