import express from 'express';
import {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    moderateProduct,
    moderateReview,
} from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// All routes here are Admin only
router.use(protect, authorize('admin'));

// Stats
router.get('/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);

// Content Moderation
router.patch('/products/:id/moderate', moderateProduct);
router.patch('/reviews/:id/moderate', moderateReview);

export default router;
