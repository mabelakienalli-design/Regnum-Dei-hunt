const jwt = require('jsonwebtoken');

const staffAuth = (req, res, next) => {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: 'Authorization token is required'
            });
        }

        // Check Bearer format
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Invalid authorization format'
            });
        }

        // Get token
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store staff information in request
        req.staff = decoded;

        next();

    } catch (error) {
        console.error('Staff authentication error:', error);

        return res.status(401).json({
            message: 'Invalid or expired authorization token'
        });
    }
};

module.exports = staffAuth;