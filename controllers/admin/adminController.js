const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const Vendor = require("../../models/vendorSchema");

//Page error
const pageError = async (req, res) => {
    try {

        res.render("page-error")
    } catch (error) {
        res.redirect("/pageNotFound")

    }

}

//Loading of login page 
const loadLogin = (req, res) => {
    const error = req.query.error || null;
    res.render("admin-login", { message: error, error: error });
};


//Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render("admin-login", {
                message: "Email and password are required",
                error: "Email and password are required"
            });
        }

        const admin = await User.findOne({ email, isAdmin: true });
        if (!admin || !admin.isAdmin) {
            return res.render("admin-login", {
                message: "Admin account not found",
                error: "Admin account not found"
            });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.render("admin-login", {
                message: "Incorrect email or password",
                error: "Incorrect email or password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                isAdmin: true,
                email: admin.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000 // 1 hour in milliseconds
        });

        return res.redirect("/admin/");

    } catch (error) {
        console.error("Login error:", error);
        return res.redirect("/page-error");
    }
};


//loading of Dashboard
const loadDashboard = async (req, res) => {
    try {
        const adminId = req.user.id; // Comes from authenticateAdmin middleware
        const admin = await User.findById(adminId)

        if (!admin || !admin.isAdmin) {
            return res.redirect("/admin/login?error=Unauthorized access");
        }

        res.render('dashboard');
    } catch (error) {
        console.error('Dashboard error:', error);
        return res.redirect("/page-error");
    }
};


//Loading of users list
const loadUsers = async (req, res) => {
    try {
        const adminId = req.user.id;

        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = 3; // Number of users per page
        const skip = (page - 1) * limit;

        const [totalUsers, activeUsers, newUsers, users, admin, totalCount] = await Promise.all([
            User.countDocuments({ isAdmin: false }),
            User.countDocuments({ isActive: true, isAdmin: false }),
            User.countDocuments({
                createdAt: { $gte: new Date(new Date().setDate(1)).setHours(0, 0, 0, 0) },
                isAdmin: false
            }),
            User.find(
                { isAdmin: false },
                'id name email createdAt isBlocked'
            )
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.findById(adminId),
            User.countDocuments({ isAdmin: false }) // Total count for pagination
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        if (!admin || !admin.isAdmin) {
            return res.redirect("/admin/login?error=Unauthorized access");
        }

        res.render("users", {
            admin,
            users,
            totalUsers,
            activeUsers,
            newUsers,
            currentPage: page,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        });

    } catch (error) {
        console.error("Error loading users:", error);
        return res.redirect("/page-error");
    }
};


//Customer Block
const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id
        await User.updateOne({ _id: id }, { $set: { isBlocked: true } })
        res.redirect("/admin/users")
        console.log("User blocked");

    } catch (error) {
        res.redirect("/page-error")
        console.log("An error occured while blocking user");

    }

}

//Customer Unblock
const customerUnblocked = async (req, res) => {
    try {
        let id = req.query.id
        await User.updateOne({ _id: id }, { $set: { isBlocked: false } })
        res.redirect("/admin/users")
        console.log("User unblocked");

    } catch (error) {
        res.redirect("/page-error")
        console.log("An error occured while unblocking user");

    }
}


//Loading of Bookings
const loadBookings = async (req, res) => {
    try {

        const adminId = req.user.id;
        const admin = await User.findById(adminId);


        if (!admin || !admin.isAdmin) {
            return res.redirect("/admin/login");
        }

        res.render('bookings');

    } catch (error) {
        console.error('Bookings page error:', error);
        return res.redirect("/page-error");
    }
}



//Load Vendors
const loadVendors = async (req, res) => {
    try {
        const adminId = req.user.id;
        const admin = await User.findById(adminId);

        if (!admin || !admin.isAdmin) {
            return res.redirect("/admin/login");
        }

        const vendors = await Vendor.find({})
            .select('name email phone isVerified isBlocked createdAt')
            .sort({ createdAt: -1 });

        res.render('vendors', {
            admin,
            vendors,
            currentPage: 'vendors'
        });

    } catch (error) {
        console.error('Vendor page error:', error);
        return res.redirect("/page-error");
    }
}




//Logout
const logout = async (req, res) => {
    try {
        res.clearCookie("auth_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        return res.redirect("/admin/login");
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).send("Server error");
    }
};



module.exports = {
    loadLogin,
    pageError,
    login,
    loadDashboard,
    logout,
    loadUsers,
    loadBookings,
    loadVendors,
    customerBlocked,
    customerUnblocked
};