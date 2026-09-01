const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    try {
        const jwtSecret =
            process.env.JWT_SECRET ||
            process.env.jwt_secret;

        if (!jwtSecret) {
            return res.status(500).json({
                success: false,
                message: "JWT_SECRET is not configured",
            });
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            jwtSecret
        );

        req.user = {
            ...decoded,
            _id: decoded.userId || decoded._id || decoded.id,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Not authorized, token failed",
        });
    }
};

module.exports = { protect };
