import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/me').get(protect, getUserProfile).patch(protect, updateUserProfile);

export default router;
