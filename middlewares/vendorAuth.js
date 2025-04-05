const jwt = require('jsonwebtoken');
const Vendor = require('../models/vendorSchema');
require('dotenv').config();

const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.redirect('/vendor/login?error=Please login to continue');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const vendor = await Vendor.findById(decoded.id);

        if (!vendor) {
            res.clearCookie('auth_token');
            console.log("no token found");

            return res.redirect('/vendor/login?error=Invalid session');
        }



        if (vendor.isBlocked) {
            res.clearCookie('auth_token');
            console.log("vendor acc blocked");
            return res.redirect('/vendor/login?error=Your account has been blocked');
        }
        if (!vendor.isApproved) {
            res.clearCookie("auth_token");
            console.log("not approved");
            return res.redirect("/vendor/login?message=Account is not yet approved by admin");

        }

        req.vendor = vendor;
        next();

    } catch (error) {
        console.error('Auth error:', error);
        res.clearCookie('auth_token');
        return res.redirect('/vendor/login?error=Session expired');
    }
};

const checkAuth = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const vendor = await Vendor.findById(decoded.id);

            if (vendor && !vendor.isBlocked && vendor.isApproved) {
                return res.redirect("/vendor/dashboard");
            }
        }
        next();
    } catch (error) {
        next();
    }
};








module.exports = {
    requireAuth,
    checkAuth
};
