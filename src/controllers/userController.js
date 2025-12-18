import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';

// @desc    Get user profile
// @route   GET /api/users/me
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PATCH /api/users/me
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = await bcrypt.hash(req.body.password, 10);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: req.headers.authorization.split(' ')[1] // Keep existing token
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
