import express from 'express';
import { streamMedia } from '../controllers/mediaController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/media/stream
// @desc    Proxy and stream media from a URL
// @access  Private
router.get('/stream', streamMedia);

export default router;
