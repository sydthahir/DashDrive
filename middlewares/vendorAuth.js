const jwt = require('jsonwebtoken');
const Vendor = require('../models/vendorSchema');
require('dotenv').config();

const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.vendor_token;

        if (!token) {
            console.log("no token  for login");

            return res.redirect('/vendor/login?error=Please login to continue');

        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "vendor") {
            return res.status(403).send("Access denied");
        }

        const vendor = await Vendor.findById(decoded.vendorId);


        if (!vendor) {
            res.clearCookie('vendor_token');
            console.log("no vendor found");

            return res.redirect('/vendor/login?error=Invalid session');
        }



        if (vendor.isBlocked) {
            res.clearCookie('vendor_token');
            console.log("vendor acc blocked");
            return res.redirect('/vendor/login?error=Your account has been blocked');
        }
        if (!vendor.isApproved) {
            res.clearCookie("vendor_token");
            console.log("not approved");
            return res.redirect("/vendor/login?message=Account is not yet approved by admin, Please try after sometime");

        }

        req.vendor = vendor;
        next();

    } catch (error) {
        console.error('Auth error:', error);
        res.clearCookie('vendor_token');
        return res.redirect('/vendor/login?error=Session expired');
    }
};

const checkAuth = async (req, res, next) => {
    try {
        const token = req.cookies.vendor_token;

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const vendor = await Vendor.findById(decoded.vendorId);

            if (vendor && !vendor.isBlocked && vendor.isApproved) {
                return res.redirect("/vendor/");
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
