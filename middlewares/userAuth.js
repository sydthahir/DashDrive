const jwt = require("jsonwebtoken")
const env = require("dotenv").config()



const authenticateUser = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.redirect("/login"); // Redirect if no token found
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.redirect("/login"); // Redirect if invalid token
        }
        req.user = decoded; // Attach user data to request object
        next();
    });
};

module.exports = authenticateUser;
