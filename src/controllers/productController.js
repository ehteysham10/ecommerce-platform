import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/Product.js';

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Seller
const createProduct = asyncHandler(async (req, res) => {
    const { title, description, price, category, stock, images: bodyImages } = req.body || {};

    let images = bodyImages || [];

    // Handle File Uploads
    if (req.files && req.files.length > 0) {
        const uploadedImages = req.files.map((file) => file.path);
        // If bodyImages is a string (single URL), convert to array
        const existingImages = Array.isArray(images) ? images : [images].filter(Boolean);
        images = [...existingImages, ...uploadedImages];
    }

    if (!title) {
        res.status(400);
        throw new Error('Please add a product title');
    }

    const product = await Product.create({
        sellerId: req.user._id,
        title,
        description,
        price,
        category,
        stock,
        images,
    });

    res.status(201).json(product);
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, minPrice, maxPrice, sort } = req.query;

    // Filter builder
    const query = { isActive: true };

    if (category) {
        query.category = category;
    }

    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Sort builder
    let sortOption = {};
    if (sort === 'price_asc') {
        sortOption.price = 1;
    } else if (sort === 'price_desc') {
        sortOption.price = -1;
    } else {
        sortOption.createdAt = -1; // Default new to old
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
        .sort(sortOption)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

    res.status(200).json({
        total: count,
        page: Number(page),
        limit: Number(limit),
        products,
    });
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate(
        'sellerId',
        'name email'
    );

    if (product) {
        res.status(200).json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Seller
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        if (product.sellerId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this product');
        }

        const { title, description, price, category, stock, images: bodyImages } = req.body || {};

        let images = bodyImages || product.images;

        // Handle File Uploads
        if (req.files && req.files.length > 0) {
            const uploadedImages = req.files.map((file) => file.path);
            const currentImages = Array.isArray(images) ? images : [images].filter(Boolean);
            images = [...currentImages, ...uploadedImages];
        }

        product.title = title || product.title;
        product.description = description || product.description;
        product.price = price || product.price;
        product.category = category || product.category;
        product.stock = stock !== undefined ? stock : product.stock;
        product.images = images;

        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product (Soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Seller
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        if (product.sellerId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to delete this product');
        }

        product.isActive = false;
        await product.save();

        res.status(200).json({ message: 'Product removed (soft delete)' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

export {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
