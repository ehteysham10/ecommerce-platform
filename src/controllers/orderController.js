import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Buyer
const createOrder = asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('No order items');
    }

    let totalAmount = 0;
    const orderItems = [];

    // 1. Validate items and Snap prices
    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            res.status(404);
            throw new Error(`Product not found: ${item.productId}`);
        }

        if (!product.isActive) {
            res.status(400);
            throw new Error(`Product is no longer available: ${product.title}`);
        }

        // We check stock but DON'T reduce it yet (Phase 4.1)
        if (product.stock < item.quantity) {
            res.status(400);
            throw new Error(`Insufficient stock for product: ${product.title}`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
            productId: product._id,
            sellerId: product.sellerId,
            quantity: item.quantity,
            priceAtPurchase: product.price,
            status: 'pending',
        });
    }

    // 2. Create Order (Stock reduction moved to payOrder)
    const order = new Order({
        buyerId: req.user._id,
        items: orderItems,
        shippingAddress,
        paymentMethod,
        totalAmount,
        orderStatus: 'pending',
        paymentStatus: 'unpaid',
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
});

// @desc    Pay for an order (Simulated Stripe)
// @route   POST /api/v1/orders/:id/pay
// @access  Private/Buyer
const payOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // 1. Check Ownership
    if (order.buyerId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to pay for this order');
    }

    // 2. Check current status
    if (order.orderStatus !== 'pending') {
        res.status(400);
        throw new Error(`Cannot pay for order in ${order.orderStatus} status`);
    }

    // 3. Late Stock Validation & Prep Reduction
    const productsToUpdate = [];
    for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (!product || product.stock < item.quantity || !product.isActive) {
            // If stock ran out between creation and payment, we must cancel the order
            order.orderStatus = 'cancelled';
            order.items.forEach(i => i.status = 'cancelled');
            await order.save();
            
            res.status(400);
            throw new Error(`Payment failed: Insufficient stock for ${product?.title || 'a product'}. Order has been cancelled.`);
        }
        productsToUpdate.push({ id: product._id, quantity: item.quantity });
    }

    // 4. Create Stripe Checkout Session
    try {
        const line_items = await Promise.all(order.items.map(async (item) => {
            const product = await Product.findById(item.productId);
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.title,
                        description: product.description,
                    },
                    unit_amount: Math.round(item.priceAtPurchase * 100), // cents
                },
                quantity: item.quantity,
            };
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/api/v1/orders/confirm-payment?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/api/v1/orders/cancel-payment?order_id=${order._id}`,
            customer_email: req.user.email,
            metadata: {
                order_id: order._id.toString(),
            },
        });

        order.checkoutSessionId = session.id;
        await order.save();

        res.json({ 
            message: 'Checkout session created', 
            url: session.url // This is the redirect URL the user visits
        });

    } catch (error) {
        console.error('STRIPE CHECKOUT ERROR:', error.message);
        res.status(500).json({ message: 'Could not create checkout session' });
    }
});

// @desc    Confirm Stripe Checkout Payment
// @route   GET /api/v1/orders/confirm-payment
// @access  Public (Redirected from Stripe)
const confirmCheckoutPayment = asyncHandler(async (req, res) => {
    const { session_id } = req.query;

    if (!session_id) {
        res.status(400);
        throw new Error('Session ID is required');
    }

    // 1. Verify Session with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const orderId = session.metadata.order_id;
    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.paymentStatus === 'paid') {
        return res.json({ message: 'Order already paid', order });
    }

    if (session.payment_status === 'paid') {
        // 2. Perform Late Stock Validation again before committing
        const productsToUpdate = [];
        for (const item of order.items) {
            const product = await Product.findById(item.productId);
            if (!product || product.stock < item.quantity || !product.isActive) {
                // In an edge case where stock ran out during the 2 mins user was on Stripe page
                res.status(400);
                throw new Error(`Refund required: Insufficient stock for ${product?.title}. Please contact support.`);
            }
            productsToUpdate.push({ id: product._id, quantity: item.quantity });
        }

        // 3. Success Flow: Commit status and stock
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        order.paidAt = Date.now();
        order.paymentResult = {
            id: session.id,
            status: 'succeeded',
            update_time: new Date().toISOString(),
        };

        order.items.forEach(item => item.status = 'confirmed');
        await order.save();

        for (const p of productsToUpdate) {
            await Product.findByIdAndUpdate(p.id, { $inc: { stock: -p.quantity } });
        }

        res.json({ message: 'Payment confirmed and stock reduced', order });
    } else {
        res.status(400).json({ message: 'Payment not successful' });
    }
});


// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private/Buyer
const getBuyerOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ buyerId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get seller orders (items related to seller)
// @route   GET /api/orders/seller
// @access  Private/Seller
const getSellerOrders = asyncHandler(async (req, res) => {
    // Find orders containing items belonging to this seller
    const orders = await Order.find({ 'items.sellerId': req.user._id })
        .populate('buyerId', 'name email')
        .sort({ createdAt: -1 });

    // Filter items to show only what belongs to this seller
    const sellerOrders = orders.map((order) => {
        const filteredItems = order.items.filter(
            (item) => item.sellerId.toString() === req.user._id.toString()
        );
        
        return {
            _id: order._id,
            buyer: order.buyerId,
            items: filteredItems,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
        };
    });

    res.json(sellerOrders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getAdminOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({})
        .populate('buyerId', 'name email')
        .sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Update order item status (Seller) or full order status (Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private/Seller/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    const { status, itemId } = req.body; // itemId is optional if Admin updates whole order

    // Admin can update overall status
    if (req.user.role === 'admin') {
        if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
            res.status(400);
            throw new Error('Invalid status');
        }

        // Logic check: cannot move from cancelled
        if (order.orderStatus === 'cancelled') {
            res.status(400);
            throw new Error('Cannot update a cancelled order');
        }

        order.orderStatus = status;
        if (status === 'delivered') order.deliveredAt = Date.now();
        
        // Also update all items if Admin sets to cancelled or delivered? 
        // For simplicity, let's say Admin update affects top-level. 
        
        const updatedOrder = await order.save();
        return res.json(updatedOrder);
    }

    // Seller can update status of their items
    if (req.user.role === 'seller') {
        if (!itemId) {
            res.status(400);
            throw new Error('Item ID required for seller update');
        }

        const item = order.items.find((i) => i._id.toString() === itemId);

        if (!item) {
            res.status(404);
            throw new Error('Order item not found');
        }

        if (item.sellerId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to update this item');
        }

        // Validate status transition
        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['shipped', 'cancelled'],
            'shipped': ['delivered'],
            'delivered': [],
            'cancelled': []
        };

        if (!validTransitions[item.status].includes(status)) {
            res.status(400);
            throw new Error(`Invalid status transition from ${item.status} to ${status}`);
        }

        item.status = status;
        
        // If all items are delivered, set order as delivered? 
        // For now, keep it independent. 

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    }
});

export {
    createOrder,
    getBuyerOrders,
    getSellerOrders,
    getAdminOrders,
    updateOrderStatus,
    payOrder,
    confirmCheckoutPayment,
};
