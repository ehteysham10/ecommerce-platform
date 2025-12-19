import express from 'express';
import {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    getAdminReviews,
} from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// General review routes
router.route('/')
    .post(protect, authorize('buyer'), createReview)
    .get(protect, authorize('admin'), getAdminReviews);

// Product specific reviews (Public)
router.get('/product/:productId', getProductReviews);

// Manage individual reviews
router.route('/:id')
    .patch(protect, authorize('buyer'), updateReview)
    .delete(protect, authorize('buyer', 'admin'), deleteReview);

export default router;
