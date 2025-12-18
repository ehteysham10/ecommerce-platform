export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            const err = new Error(`User role ${req.user.role} is not authorized to access this route`);
            return next(err);
        }
        next();
    };
};

export const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401);
        const err = new Error('Not authorized as an admin');
        next(err);
    }
};
