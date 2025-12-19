import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import AuditLog from '../models/AuditLog.js';

// Helper: Log Admin Action
const logAdminAction = async (adminId, action, targetType, targetId, details) => {
    await AuditLog.create({
        adminId,
        action,
        targetType,
        targetId,
        details,
    });
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Aggregated Revenue
    const revenueData = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Top Selling Products
    const topProducts = await Order.aggregate([
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.productId',
                totalSold: { $sum: '$items.quantity' },
            },
        },
        { $sort: { totalSold: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productDetails',
            },
        },
        { $unwind: '$productDetails' },
        {
            $project: {
                _id: 1,
                title: '$productDetails.title',
                totalSold: 1,
            },
        },
    ]);

    res.json({
        counts: {
            users: totalUsers,
            sellers: totalSellers,
            buyers: totalBuyers,
            products: totalProducts,
            orders: totalOrders,
        },
        revenue: {
            total: totalRevenue,
            averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0,
        },
        topProducts,
    });
});

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const { role, isActive, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const count = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

    res.json({
        total: count,
        page: Number(page),
        limit: Number(limit),
        users,
    });
});

// @desc    Update user status (Activate/Deactivate)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role === 'admin' && user.email === process.env.SUPER_ADMIN_EMAIL) {
        res.status(400);
        throw new Error('Cannot deactivate the Super Admin');
    }

    user.isActive = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
    await user.save();

    await logAdminAction(
        req.user._id,
        user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        'User',
        user._id,
        `Status changed to ${user.isActive ? 'Active' : 'Inactive'}`
    );

    res.json({ message: `User status updated to ${user.isActive ? 'Active' : 'Inactive'}`, user });
});

// @desc    Admin Product Moderation
// @route   PATCH /api/admin/products/:id/moderate
// @access  Private/Admin
const moderateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    product.isActive = req.body.isActive !== undefined ? req.body.isActive : !product.isActive;
    await product.save();

    await logAdminAction(
        req.user._id,
        product.isActive ? 'ACTIVATE_PRODUCT' : 'DEACTIVATE_PRODUCT',
        'Product',
        product._id,
        `Visibility changed to ${product.isActive ? 'Public' : 'Hidden'}`
    );

    res.json({ message: `Product visibility updated`, product });
});

// @desc    Admin Review Moderation
// @route   PATCH /api/admin/reviews/:id/moderate
// @access  Private/Admin
const moderateReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    review.isActive = req.body.isActive !== undefined ? req.body.isActive : !review.isActive;
    await review.save();

    // Re-aggregate product rating
    const reviews = await Review.find({ productId: review.productId, isActive: true });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
        ? reviews.reduce((acc, item) => item.rating + acc, 0) / totalReviews 
        : 0;

    await Product.findByIdAndUpdate(review.productId, {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
    });

    await logAdminAction(
        req.user._id,
        review.isActive ? 'ACTIVATE_REVIEW' : 'DEACTIVATE_REVIEW',
        'Review',
        review._id,
        `Review moderation: ${review.isActive ? 'Active' : 'Inactive'}`
    );

    res.json({ message: 'Review moderation complete', review });
});

export {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    moderateProduct,
    moderateReview,
};
