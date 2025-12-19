import asyncHandler from '../utils/asyncHandler.js';

// @desc    System health check
// @route   GET /api/health
// @access  Public
const getHealth = asyncHandler(async (req, res) => {
    res.status(200).json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

export { getHealth };
