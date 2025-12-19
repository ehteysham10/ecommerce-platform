import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
    {
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        title: {
            type: String,
            required: [true, 'Please add a product title'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Please add a description'],
        },
        price: {
            type: Number,
            required: [true, 'Please add a price'],
            min: [0.01, 'Price must be greater than 0'],
        },
        category: {
            type: String,
            required: [true, 'Please add a category'],
            index: true,
        },
        stock: {
            type: Number,
            required: [true, 'Please add stock quantity'],
            min: [0, 'Stock cannot be negative'],
            default: 0,
        },
        images: {
            type: [String],
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        averageRating: {
            type: Number,
            default: 0,
        },
        totalReviews: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
