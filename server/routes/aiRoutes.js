import express from 'express';
import { getRecommendation } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/advisor', protect, getRecommendation);

export default router;
