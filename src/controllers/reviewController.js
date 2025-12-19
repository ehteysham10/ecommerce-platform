import asyncHandler from '../utils/asyncHandler.js';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Helper: Calculate and update product average rating
const updateProductRating = async (productId) => {
    const reviews = await Review.find({ productId, isActive: true });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
        ? reviews.reduce((acc, item) => item.rating + acc, 0) / totalReviews 
        : 0;

    await Product.findByIdAndUpdate(productId, {
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews,
    });
};

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private/Buyer
const createReview = asyncHandler(async (req, res) => {
    const { productId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        res.status(400);
        throw new Error('Rating must be between 1 and 5');
    }

    // 1. Authenticity: Check if buyer purchased and it was delivered
    const hasPurchased = await Order.findOne({
        buyerId: req.user._id,
        'items.productId': productId,
        'items.status': 'delivered', // Only allow reviews once delivered
    });

    if (!hasPurchased) {
        res.status(403);
        throw new Error('You can only review products that have been delivered to you.');
    }

    // 2. Prevent duplicate reviews
    const alreadyReviewed = await Review.findOne({
        productId,
        buyerId: req.user._id,
    });

    if (alreadyReviewed) {
        res.status(400);
        throw new Error('Product already reviewed');
    }

    const review = await Review.create({
        productId,
        buyerId: req.user._id,
        rating: Number(rating),
        comment,
    });

    // 3. Update Aggregation
    await updateProductRating(productId);

    res.status(201).json(review);
});

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    const query = { productId: req.params.productId, isActive: true };

    let sortOption = { createdAt: -1 };
    if (sort === 'highest') sortOption = { rating: -1 };
    if (sort === 'lowest') sortOption = { rating: 1 };

    const count = await Review.countDocuments(query);
    const reviews = await Review.find(query)
        .populate('buyerId', 'name')
        .sort(sortOption)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

    res.json({
        total: count,
        page: Number(page),
        limit: Number(limit),
        reviews,
    });
});

// @desc    Update review
// @route   PATCH /api/reviews/:id
// @access  Private/Buyer
const updateReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Ownership check
    if (review.buyerId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this review');
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    const updatedReview = await review.save();

    // Update Aggregation
    await updateProductRating(review.productId);

    res.json(updatedReview);
});

// @desc    Delete review (Soft delete)
// @route   DELETE /api/reviews/:id
// @access  Private/Buyer/Admin
const deleteReview = asyncHandler(async (req, res) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Permission check: Owner or Admin
    if (
        review.buyerId.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
    ) {
        res.status(403);
        throw new Error('Not authorized to delete this review');
    }

    review.isActive = false;
    await review.save();

    // Update Aggregation
    await updateProductRating(review.productId);

    res.json({ message: 'Review removed' });
});

// @desc    Get all reviews for moderation
// @route   GET /api/reviews
// @access  Private/Admin
const getAdminReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({})
        .populate('productId', 'title')
        .populate('buyerId', 'name email')
        .sort({ createdAt: -1 });
    res.json(reviews);
});

export {
    createReview,
    getProductReviews,
    updateReview,
    deleteReview,
    getAdminReviews,
};
