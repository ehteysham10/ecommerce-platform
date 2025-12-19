import express from 'express';
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} from '../controllers/productController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router
    .route('/')
    .get(getProducts)
    .post(protect, authorize('seller', 'admin'), upload.array('images', 5), createProduct);

router
    .route('/:id')
    .get(getProductById)
    .put(protect, authorize('seller', 'admin'), upload.array('images', 5), updateProduct)
    .delete(protect, authorize('seller', 'admin'), deleteProduct);

export default router;
