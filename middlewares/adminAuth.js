const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateAdmin = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        console.log("No token found");
        return res.redirect("/admin/login?error=Please login to access this page");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify if user is admin
        if (!decoded.isAdmin) {
            console.log("User is not an admin");
            res.clearCookie("auth_token");
            return res.redirect("/admin/login");
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.log("Token verification failed:", error.message);
        res.clearCookie("auth_token");
        return res.redirect("/admin/login");
    }
};

module.exports = authenticateAdmin;