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

export const superAdmin = (req, res, next) => {
    // Debug logs to help identify the issue
    console.log('--- Super Admin Check ---');
    console.log('User Role:', req.user?.role);
    console.log('User Email:', req.user?.email);
    console.log('Expected Email (from .env):', process.env.SUPER_ADMIN_EMAIL);
    
    // Check if user is admin AND their email matches the SUPER_ADMIN_EMAIL env var
    const isSuperAdmin = 
        req.user && 
        req.user.role === 'admin' && 
        req.user.email.toLowerCase().trim() === process.env.SUPER_ADMIN_EMAIL?.toLowerCase().trim();

    console.log('Is Super Admin Match:', !!isSuperAdmin);
    console.log('-------------------------');

    if (isSuperAdmin) {
        next();
    } else {
        res.status(403);
        const err = new Error('Not authorized as Super Admin. Only the primary admin can perform this action.');
        next(err);
    }
};
