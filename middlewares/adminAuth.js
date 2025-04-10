const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateAdmin = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        console.log("No token found for login");
        if (req.xhr || req.headers['content-type'] === 'application/json') {
            return res.status(401).json({ success: false, message: "No token provided, please log in" });
        }
        return res.redirect("/admin/login?error=Please login to access this page");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
        if (!decoded.isAdmin) {
            console.log("User is not an admin");
            if (req.xhr || req.headers['content-type'] === 'application/json') {
                return res.status(403).json({ success: false, message: "Unauthorized access" });
            }
            return res.redirect('/admin/login?error=Unauthorized access');
        }
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Token verification error:", error.message);
        if (req.xhr || req.headers['content-type'] === 'application/json') {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }
        return res.redirect('/admin/login?error=Invalid token');
    }
};

module.exports = authenticateAdmin;