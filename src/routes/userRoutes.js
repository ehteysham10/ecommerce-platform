import express from 'express';
import {
    getUserProfile,
    updateUserProfile,
    createAdmin,
    deleteUser,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize, superAdmin } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.route('/me').get(protect, getUserProfile).patch(protect, updateUserProfile);

router.route('/admins').post(protect, superAdmin, createAdmin);

router.route('/:id').delete(protect, superAdmin, deleteUser);

export default router;
