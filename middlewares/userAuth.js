const jwt = require("jsonwebtoken")
const User = require("../models/userSchema")
const env = require("dotenv").config()

const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.user_token;

        if (!token) {
            console.log("No token found");
            return res.redirect("/login?message=Please login to access this page");
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check token is expired
        if (Date.now() >= decoded.exp * 1000) {
            console.log("Token expired");
            res.clearCookie("user_token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/"
            });
            return res.redirect("/login?message=Please login to access this page");
        }

        // Find user 
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log("User not found in database for ID:", decoded.userId);
            res.clearCookie("user_token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/"
            });
            return res.redirect("/login");
        }

        // Check user is blocked
        if (user.isBlocked) {
            console.log("User is blocked");
            res.clearCookie("user_token", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/"
            });
            return res.redirect("/login?message=Your account has been blocked !");
        }

        // Attach user to request
        req.user = user;
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.clearCookie("user_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/"
        });
        return res.redirect("/login");
    }
}

//Checks user is logged in ?
const guestOnly = (req, res, next) => {
    const token = req.cookies.user_token

    if (!token) return next()

    try {
        jwt.verify(token, process.env.JWT_SECRET)
        return res.redirect("/home")
    } catch (err) {
        return next()
    }
}


module.exports = {
    authenticateUser,
    guestOnly
};
