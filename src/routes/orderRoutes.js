import express from 'express';
import {
    createOrder,
    getBuyerOrders,
    getSellerOrders,
    getAdminOrders,
    updateOrderStatus,
    payOrder,
    confirmCheckoutPayment,
} from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Publicly accessible for Stripe redirect (verification happens inside)
router.get('/confirm-payment', confirmCheckoutPayment);

// Base route: Create order (Buyer), Get all orders (Admin)
router.route('/')
    .post(protect, authorize('buyer'), createOrder)
    .get(protect, authorize('admin'), getAdminOrders);

// Buyer's own orders
router.get('/myorders', protect, authorize('buyer'), getBuyerOrders);

// Seller's specific items
router.get('/seller', protect, authorize('seller'), getSellerOrders);

// Status update (Seller or Admin)
router.patch('/:id/status', protect, authorize('seller', 'admin'), updateOrderStatus);

// Payment route (Buyer only)
router.post('/:id/pay', protect, authorize('buyer'), payOrder);

export default router;
